import Stripe from "stripe";
import Order from "../models/order.model.js";
import Employee from "../models/employee.model.js";
import Employer from "../models/employer.model.js";
import TestPanel from "../../superAdmin/models/TestPanel.model.js";
import CollectionSite from "../../superAdmin/models/CollectionSite.model.js";
import questOrderService from "../../../services/questOrder.service.js";
import catchAsync from "../../../utils/catchAsync.js";
import AppError from "../../../utils/AppError.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder");

/**
 * @desc    Preview an order before submission (dry run validation)
 * @route   POST /api/v1/employer/orders/preview
 * @access  Private (Employer Only)
 */
export const previewOrder = catchAsync(async (req, res, next) => {
    const { employeeId, panelId, siteId, testType, reasonForTest, collectionType } = req.body;

    if (!employeeId || !panelId || !siteId || !testType || !reasonForTest || !collectionType) {
        return next(new AppError("Missing required preview parameters.", 400));
    }

    // 1. Resolve & Validate Employee
    const employee = await Employee.findOne({ _id: employeeId, employer_id: req.user._id });
    if (!employee) {
        return next(new AppError("Candidate not found or unauthorized.", 404));
    }
    if (employee.status !== "Active") {
        return next(new AppError("Candidate status is inactive.", 400));
    }

    // 2. Resolve & Validate Panel
    let panel = null;
    if (panelId.match(/^[0-9a-fA-F]{24}$/)) {
        panel = await TestPanel.findById(panelId);
    }
    if (!panel) {
        panel = await TestPanel.findOne({ panel_id: panelId });
    }

    if (!panel) {
        return next(new AppError("Test Panel not found.", 404));
    }
    if (!panel.unitCode) {
        return next(new AppError("Test panel is missing an active Quest UnitCode mapping.", 400));
    }

    // 3. Resolve & Validate Collection Site
    let site = null;
    if (siteId.match(/^[0-9a-fA-F]{24}$/)) {
        site = await CollectionSite.findById(siteId);
    }
    if (!site) {
        site = await CollectionSite.findOne({ siteCode: siteId });
    }

    if (!site) {
        return next(new AppError("Collection site not found.", 404));
    }

    // 4. Run Site Compatibility Checks
    const siteWarnings = [];
    if (testType === "DOT" && !site.capabilities?.dotPhysicals && !site.capabilities?.electronicCCF) {
        siteWarnings.push("Selected collection site may have limited DOT electronic CCF support.");
    }
    if (collectionType.toLowerCase().includes("hair") && !site.capabilities?.hairCollection) {
        siteWarnings.push("Selected collection site does not list Hair Collection capability.");
    }
    if (collectionType.toLowerCase().includes("alcohol") && !site.capabilities?.breathAlcohol) {
        siteWarnings.push("Selected collection site does not list Breath Alcohol testing capability.");
    }

    res.status(200).json({
        success: true,
        preview: {
            employee: {
                name: `${employee.first_name} ${employee.last_name}`,
                email: employee.email,
                phone: employee.phone
            },
            panel: {
                title: panel.title,
                price: panel.price,
                unitCode: panel.unitCode
            },
            site: {
                name: site.name,
                address: site.address,
                phone: site.phone
            },
            dotType: testType,
            warnings: siteWarnings,
            isReady: true
        }
    });
});

/**
 * @desc    Submit a new drug test order (Charge Card -> Send Quest Order -> Persist DB)
 * @route   POST /api/v1/employer/orders/create
 * @access  Private (Employer Only)
 */
export const createOrder = catchAsync(async (req, res, next) => {
    const {
        employeeId,
        panelId,
        siteId,
        testType,
        reasonForTest,
        collectionType,
        paymentMethodId
    } = req.body;

    // 1. Basic validation
    if (!employeeId || !panelId || !siteId || !testType || !reasonForTest || !collectionType || !paymentMethodId) {
        return next(new AppError("Please provide all required parameters including paymentMethodId.", 400));
    }

    // 2. Fetch Employee details
    const employee = await Employee.findOne({ _id: employeeId, employer_id: req.user._id });
    if (!employee) {
        return next(new AppError("Selected employee not found or unauthorized.", 404));
    }
    if (employee.status !== "Active") {
        return next(new AppError("Selected employee profile is Inactive and ineligible for orders.", 400));
    }

    // 3. Fetch Test Panel
    let panel = null;
    if (panelId.match(/^[0-9a-fA-F]{24}$/)) {
        panel = await TestPanel.findById(panelId);
    }
    if (!panel) {
        panel = await TestPanel.findOne({ panel_id: panelId });
    }
    
    if (!panel) {
        return next(new AppError("Selected test panel not found.", 404));
    }
    if (!panel.unitCode) {
        return next(new AppError("The test panel is missing a valid Quest UnitCode mapping.", 400));
    }

    // 4. Fetch Collection Site
    let site = null;
    if (siteId.match(/^[0-9a-fA-F]{24}$/)) {
        site = await CollectionSite.findById(siteId);
    }
    if (!site) {
        site = await CollectionSite.findOne({ siteCode: siteId });
    }

    if (!site) {
        return next(new AppError("Selected collection site not found.", 404));
    }

    // 5. Resolve LabAccount from Employer Config
    const isDOT = testType === "DOT";
    const employer = await Employer.findById(req.user._id);
    const labAccount = isDOT ? employer?.labAccountDOT : employer?.labAccountNonDOT;

    if (!labAccount) {
        return next(new AppError(`No LabAccount mapping found for this employer under ${testType} order type.`, 400));
    }

    // 6. Calculate Dynamic Payment Amount
    let amountStr = panel.price.replace(/[^0-9.]/g, "");
    const amountInCents = Math.round(parseFloat(amountStr) * 100);

    if (isNaN(amountInCents) || amountInCents <= 0) {
        return next(new AppError("Invalid test panel price configuration.", 400));
    }

    // 7. Stripe PaymentIntent Capture Step
    let paymentIntent;
    try {
        console.log(`Stripe Charge: Processing dynamic charge of $${(amountInCents / 100).toFixed(2)} for ${employer.company_name}...`);
        paymentIntent = await stripe.paymentIntents.create({
            amount: amountInCents,
            currency: "usd",
            payment_method: paymentMethodId,
            confirm: true,
            automatic_payment_methods: {
                enabled: true,
                allow_redirects: "never"
            },
            metadata: {
                employerId: req.user._id.toString(),
                employeeId: employeeId,
                panelId: panelId
            }
        });

        if (paymentIntent.status !== "succeeded") {
            return next(new AppError(`Stripe Payment Intent status: ${paymentIntent.status}. Verification failed.`, 402));
        }
        console.log("Stripe Charge Succeeded: Transaction ID:", paymentIntent.id);
    } catch (stripeErr) {
        console.error("Stripe Checkout Error:", stripeErr.message);
        return next(new AppError(`Payment Process failed: ${stripeErr.message}`, 402));
    }

    // 8. Auto-Resolve Observed and Split Specimen Flags
    // Set ObservedRequested based on business rule (e.g. if site observed flag required, or DOT specific policy)
    const observedRequested = false;
    const splitSpecimenRequested = isDOT; // Standard compliance rule: DOT drug tests default to Split Specimen

    // 9. Call Quest SOAP Service Layer
    let questRes;
    try {
        questRes = await questOrderService.createQuestOrder({
            labAccount,
            unitCode: panel.unitCode,
            siteCode: site.siteCode,
            dotTest: isDOT,
            observedRequested,
            splitSpecimenRequested,
            reasonForTest: reasonForTest,
            donor: {
                firstName: employee.first_name,
                lastName: employee.last_name,
                email: employee.email,
                phone: employee.phone,
                license: employee.license_number
            }
        });
    } catch (questErr) {
        console.error("Quest SOAP createOrder Integration Exception:", questErr.message);
        return next(new AppError(`Quest diagnostics API order submission exception: ${questErr.message}`, 502));
    }

    // 10. Persist internal Order record
    const newOrder = new Order({
        employer_id: req.user._id,
        employee_id: employee._id,
        questOrderId: questRes.questOrderId,
        referenceTestId: questRes.referenceTestId,
        status: questRes.status || "ordered",
        dot_type: testType,
        stripe_payment_id: paymentIntent.id,
        amount_paid: amountInCents,
        test_configuration: {
            testType,
            reasonForTest,
            collectionType,
            panelId: panel._id,
            panelTitle: panel.title,
            unitCode: panel.unitCode
        },
        employee_snapshot: {
            first_name: employee.first_name,
            last_name: employee.last_name,
            email: employee.email,
            phone: employee.phone,
            license_number: employee.license_number
        },
        site_snapshot: {
            siteCode: site.siteCode,
            name: site.name,
            address: {
                line1: site.address?.line1,
                line2: site.address?.line2,
                city: site.address?.city,
                state: site.address?.state,
                zip: site.address?.zip
            },
            phone: site.phone,
            hours: site.hours
        },
        request_payload: questRes.requestXml,
        response_payload: questRes.responseXml
    });

    await newOrder.save();

    // 11. Increment total employer stats
    await Employer.findByIdAndUpdate(req.user._id, {
        $inc: { total_orders: 1 }
    });

    res.status(201).json({
        success: true,
        message: "Order successfully placed and persisted.",
        order: newOrder
    });
});

/**
 * @desc    Get order history list for currently logged-in employer
 * @route   GET /api/v1/employer/orders
 * @access  Private (Employer Only)
 */
export const getOrdersList = catchAsync(async (req, res, next) => {
    const { status, dot_type, search, page = 1, limit = 10 } = req.query;

    const query = { employer_id: req.user._id };

    if (status) {
        query.status = status;
    }
    if (dot_type) {
        query.dot_type = dot_type;
    }

    if (search) {
        query.$or = [
            { order_number: { $regex: search, $options: "i" } },
            { "employee_snapshot.first_name": { $regex: search, $options: "i" } },
            { "employee_snapshot.last_name": { $regex: search, $options: "i" } },
            { questOrderId: { $regex: search, $options: "i" } }
        ];
    }

    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit));

    res.status(200).json({
        success: true,
        total,
        page: Number(page),
        limit: Number(limit),
        orders
    });
});

/**
 * @desc    Get single order details snapshot
 * @route   GET /api/v1/employer/orders/:id
 * @access  Private (Employer Only)
 */
export const getOrderDetails = catchAsync(async (req, res, next) => {
    const order = await Order.findById(req.params.id);

    if (!order) {
        return next(new AppError("Order record not found.", 404));
    }

    // Verify employer ownership security
    if (order.employer_id.toString() !== req.user._id.toString()) {
        return next(new AppError("Unauthorized access to this order details.", 403));
    }

    res.status(200).json({
        success: true,
        order
    });
});

/**
 * @desc    Cancel/Void an existing order
 * @route   POST /api/v1/employer/orders/cancel
 * @access  Private (Employer Only)
 */
export const cancelOrder = catchAsync(async (req, res, next) => {
    const { orderId } = req.body;

    if (!orderId) {
        return next(new AppError("Please provide an order ID to cancel.", 400));
    }

    const order = await Order.findById(orderId);
    if (!order) {
        return next(new AppError("Order record not found.", 404));
    }

    // Auth ownership check
    if (order.employer_id.toString() !== req.user._id.toString()) {
        return next(new AppError("Unauthorized access to modify this order.", 403));
    }

    if (order.status === "cancelled") {
        return next(new AppError("Order is already cancelled.", 400));
    }

    // Invoke Quest Cancel SOAP Service
    const cancelRes = await questOrderService.cancelQuestOrder(order.questOrderId, order.referenceTestId);

    if (!cancelRes.success) {
        return next(new AppError("Quest Diagnostics SOAP void request failed.", 502));
    }

    // Update local order status in MongoDB
    order.status = "cancelled";
    order.request_payload = cancelRes.requestXml;
    order.response_payload = cancelRes.responseXml;
    await order.save();

    res.status(200).json({
        success: true,
        message: "Order successfully cancelled/voided.",
        order
    });
});

import stripe from "../../../config/stripe.js";
import Employer from "../models/employer.model.js";
import catchAsync from "../../../utils/catchAsync.js";
import AppError from "../../../utils/AppError.js";

// Helper function to dynamically retrieve or create a Stripe customer
const getOrCreateCustomer = async (employer) => {
    if (employer.stripeCustomerId) {
        try {
            // Validate that the customer still exists in Stripe
            const customer = await stripe.customers.retrieve(employer.stripeCustomerId);
            if (customer && !customer.deleted) {
                return customer;
            }
        } catch (e) {
            // Customer might be deleted in Stripe but exists in our DB, we'll create a new one
            console.log("Customer retrieval failed, creating a new one:", e.message);
        }
    }

    // Create a new Customer in Stripe
    const customer = await stripe.customers.create({
        email: employer.email,
        name: `${employer.first_name} ${employer.last_name}`,
        metadata: {
            employerId: employer._id.toString(),
            companyName: employer.company_name || ""
        }
    });

    // Save to our database
    employer.stripeCustomerId = customer.id;
    await employer.save({ validateBeforeSave: false });

    return customer;
};


export const createStripeCustomer = catchAsync(async (req, res, next) => {
    const employer = await Employer.findById(req.user._id);
    if (!employer) {
        return next(new AppError("Employer not found.", 404));
    }

    const customer = await getOrCreateCustomer(employer);

    res.status(200).json({
        success: true,
        customerId: customer.id,
        message: "Stripe customer verified/created successfully."
    });
});


export const savePaymentMethod = catchAsync(async (req, res, next) => {
    const { paymentMethodId, makeDefault = true } = req.body;

    if (!paymentMethodId) {
        return next(new AppError("Please provide a paymentMethodId.", 400));
    }

    const employer = await Employer.findById(req.user._id);
    if (!employer) {
        return next(new AppError("Employer not found.", 404));
    }

    // Retrieve details of the new payment method to get its fingerprint
    const newPM = await stripe.paymentMethods.retrieve(paymentMethodId);
    if (!newPM || !newPM.card) {
        return next(new AppError("Invalid payment method token.", 400));
    }
    const newFingerprint = newPM.card.fingerprint;

    // Get or create customer
    const customer = await getOrCreateCustomer(employer);

    // List all existing cards attached to the customer to check for duplicates
    const existingPMs = await stripe.paymentMethods.list({
        customer: customer.id,
        type: "card",
    });

    // Check if a card with the same fingerprint is already attached
    const duplicatePM = existingPMs.data.find(pm => pm.card.fingerprint === newFingerprint);

    if (duplicatePM) {
        // If it is a duplicate, detach the newly created token to keep Stripe clean
        await stripe.paymentMethods.detach(paymentMethodId);

        // Optionally update the existing card as default if requested
        if (makeDefault) {
            await stripe.customers.update(customer.id, {
                invoice_settings: {
                    default_payment_method: duplicatePM.id,
                },
            });
        }

        return res.status(200).json({
            success: true,
            message: "This card was already saved. Set default selection updated.",
            paymentMethodId: duplicatePM.id,
            isDuplicate: true
        });
    }

    // Attach payment method to the customer
    await stripe.paymentMethods.attach(paymentMethodId, {
        customer: customer.id,
    });

    // Optionally set as default payment method
    if (makeDefault) {
        await stripe.customers.update(customer.id, {
            invoice_settings: {
                default_payment_method: paymentMethodId,
            },
        });
    }

    res.status(200).json({
        success: true,
        message: "Payment method attached successfully.",
        paymentMethodId
    });
});


export const getSavedPaymentMethods = catchAsync(async (req, res, next) => {
    const employer = await Employer.findById(req.user._id);
    if (!employer) {
        return next(new AppError("Employer not found.", 404));
    }

    if (!employer.stripeCustomerId) {
        return res.status(200).json({
            success: true,
            paymentMethods: []
        });
    }

    // Retrieve Stripe customer to check the default payment method ID
    const customer = await stripe.customers.retrieve(employer.stripeCustomerId);
    const defaultPaymentMethodId = customer.invoice_settings?.default_payment_method;

    // List all card-type payment methods attached to the customer
    const paymentMethods = await stripe.paymentMethods.list({
        customer: employer.stripeCustomerId,
        type: "card",
    });

    // Map payment methods to a simplified representation
    const cards = paymentMethods.data.map(pm => ({
        id: pm.id,
        brand: pm.card.brand,
        last4: pm.card.last4,
        expMonth: pm.card.exp_month,
        expYear: pm.card.exp_year,
        isDefault: pm.id === defaultPaymentMethodId,
        name: pm.billing_details?.name || ""
    }));

    res.status(200).json({
        success: true,
        paymentMethods: cards
    });
});


export const setDefaultPaymentMethod = catchAsync(async (req, res, next) => {
    const { paymentMethodId } = req.body;

    if (!paymentMethodId) {
        return next(new AppError("Please provide a paymentMethodId.", 400));
    }

    const employer = await Employer.findById(req.user._id);
    if (!employer || !employer.stripeCustomerId) {
        return next(new AppError("Stripe Customer not found for this employer.", 404));
    }

    await stripe.customers.update(employer.stripeCustomerId, {
        invoice_settings: {
            default_payment_method: paymentMethodId,
        },
    });

    res.status(200).json({
        success: true,
        message: "Default payment method updated successfully.",
        paymentMethodId
    });
});


export const deletePaymentMethod = catchAsync(async (req, res, next) => {
    const { id } = req.params;

    if (!id) {
        return next(new AppError("Please provide a paymentMethodId.", 400));
    }

    const employer = await Employer.findById(req.user._id);
    if (!employer || !employer.stripeCustomerId) {
        return next(new AppError("Stripe Customer not found for this employer.", 404));
    }

    // Retrieve customer to check if they are deleting the default payment method
    const customer = await stripe.customers.retrieve(employer.stripeCustomerId);
    const defaultPMId = customer.invoice_settings?.default_payment_method;

    // Detach payment method from customer in Stripe
    await stripe.paymentMethods.detach(id);

    // If they deleted the default one, clear default_payment_method on the customer
    if (defaultPMId === id) {
        await stripe.customers.update(employer.stripeCustomerId, {
            invoice_settings: {
                default_payment_method: null,
            },
        });
    }

    res.status(200).json({
        success: true,
        message: "Card deleted successfully."
    });
});

export const getPaymentHistory = catchAsync(async (req, res, next) => {
    const employer = await Employer.findById(req.user._id);
    if (!employer) {
        return next(new AppError("Employer not found.", 404));
    }

    if (!employer.stripeCustomerId) {
        return res.status(200).json({
            success: true,
            history: []
        });
    }

    // List all Payment Intents for the Stripe customer
    const paymentIntents = await stripe.paymentIntents.list({
        customer: employer.stripeCustomerId,
        limit: 50,
    });

    const history = paymentIntents.data.map(pi => ({
        id: pi.id,
        amount: pi.amount / 100, // convert cents back to decimal
        currency: pi.currency,
        status: pi.status,
        created: new Date(pi.created * 1000).toISOString(),
        description: pi.description,
        cardBrand: pi.charges?.data?.[0]?.payment_method_details?.card?.brand || null,
        last4: pi.charges?.data?.[0]?.payment_method_details?.card?.last4 || null
    }));

    res.status(200).json({
        success: true,
        history
    });
});

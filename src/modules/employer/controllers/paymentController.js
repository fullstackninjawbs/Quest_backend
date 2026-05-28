import stripe from "../../../config/stripe.js";
import TestPanel from "../../superAdmin/models/TestPanel.model.js";
import Employer from "../models/employer.model.js";
import catchAsync from "../../../utils/catchAsync.js";
import AppError from "../../../utils/AppError.js";


export const createPaymentIntent = catchAsync(async (req, res, next) => {
    const { panelId, amount, currency = "usd" } = req.body;

    let finalAmountInCents = 0;

    // 1. If panelId is provided, fetch panel from DB to prevent client-side amount manipulation
    if (panelId) {
        const panel = await TestPanel.findOne({ panel_id: panelId });
        if (!panel) {
            return next(new AppError("Test panel not found.", 404));
        }

        // Parse price (e.g. "$49.00" -> 4900 cents)
        const amountStr = panel.price.replace(/[^0-9.]/g, "");
        finalAmountInCents = Math.round(parseFloat(amountStr) * 100);

        if (isNaN(finalAmountInCents) || finalAmountInCents <= 0) {
            return next(new AppError("Invalid price configured for this test panel.", 400));
        }
    }
    // 2. Otherwise, use the manually passed amount (useful for generic payments or testing)
    else if (amount) {
        finalAmountInCents = Math.round(parseFloat(amount) * 100);
        if (isNaN(finalAmountInCents) || finalAmountInCents <= 0) {
            return next(new AppError("Please provide a valid payment amount.", 400));
        }
    }
    // 3. If neither is provided, throw an error
    else {
        return next(new AppError("Please provide either a panelId or an amount.", 400));
    }

    // Find employer to get their Stripe customer ID
    let stripeCustomerId;
    if (req.user) {
        const employer = await Employer.findById(req.user._id);
        if (employer && employer.stripeCustomerId) {
            stripeCustomerId = employer.stripeCustomerId;
        }
    }

    // Create the PaymentIntent on Stripe
    const paymentIntentOptions = {
        amount: finalAmountInCents,
        currency: currency.toLowerCase(),
        automatic_payment_methods: {
            enabled: true,
        },
        metadata: {
            employerId: req.user ? req.user._id.toString() : "anonymous",
            panelId: panelId || "custom_payment",
        },
    };

    if (stripeCustomerId) {
        paymentIntentOptions.customer = stripeCustomerId;
    }

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentOptions);

    res.status(200).json({
        success: true,
        clientSecret: paymentIntent.client_secret,
        amount: finalAmountInCents,
        currency: currency.toLowerCase()
    });
});
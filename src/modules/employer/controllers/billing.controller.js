import Stripe from "stripe";
import TestPanel from "../../superAdmin/models/TestPanel.model.js";
import catchAsync from "../../../utils/catchAsync.js";
import AppError from "../../../utils/AppError.js";

// Initialize Stripe with secret key from env
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder");

/**
 * @desc    Create a Stripe checkout session for ordering a test
 * @route   POST /api/v1/employer/billing/create-checkout-session
 * @access  Private (Employer)
 */
export const createCheckoutSession = catchAsync(async (req, res, next) => {
    const { panelId, successUrl, cancelUrl } = req.body;

    if (!panelId) {
        return next(new AppError("Please provide a panel ID.", 400));
    }

    // Find the test panel to get the price
    const panel = await TestPanel.findOne({ panel_id: panelId });

    if (!panel) {
        return next(new AppError("Test panel not found.", 404));
    }

    // Parse price (assuming format like "$49.00" or just "49.00")
    let amountStr = panel.price.replace(/[^0-9.]/g, "");
    const amount = Math.round(parseFloat(amountStr) * 100); // Convert to cents

    if (isNaN(amount) || amount <= 0) {
        return next(new AppError("Invalid price for this panel.", 400));
    }

    const origin = req.headers.origin || "http://localhost:5173"; // Fallback to common Vite port

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
            {
                price_data: {
                    currency: "usd",
                    product_data: {
                        name: panel.title,
                        description: panel.description,
                    },
                    unit_amount: amount,
                },
                quantity: 1,
            },
        ],
        mode: "payment",
        success_url: successUrl || `${origin}/order-test/confirm`,
        cancel_url: cancelUrl || `${origin}/order-test`,
        metadata: {
            panelId: panelId,
            employerId: req.user._id.toString(),
        },
    });

    res.status(200).json({
        success: true,
        url: session.url,
    });
});

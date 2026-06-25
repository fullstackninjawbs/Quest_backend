import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
    {
        order_number: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            index: true,
        },
        employer_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Employer",
            required: [true, "Employer ID is required"],
            index: true,
        },
        employee_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Employee",
            required: [true, "Employee ID is required"],
            index: true,
        },
        questOrderId: {
            type: String,
            trim: true,
        },
        referenceTestId: {
            type: String,
            trim: true,
            index: true,
        },
        status: {
            type: String,
            enum: ["ordered", "scheduled", "in-progress", "MRO Review", "completed", "cancelled", "failed"],
            default: "ordered",
            index: true,
        },
        dot_type: {
            type: String,
            enum: ["DOT", "NON-DOT"],
            default: "DOT",
        },
        stripe_payment_id: {
            type: String,
            trim: true,
        },
        amount_paid: {
            type: Number, // In cents
            required: true,
        },
        test_configuration: {
            testType: { type: String, required: true },
            reasonForTest: { type: String, required: true },
            collectionType: { type: String, required: true },
            panelId: { type: mongoose.Schema.Types.ObjectId, ref: "TestPanel", required: true },
            panelTitle: { type: String, required: true },
            unitCode: { type: String, required: true }
        },
        employee_snapshot: {
            first_name: { type: String, required: true },
            last_name: { type: String, required: true },
            email: { type: String, required: true },
            phone: { type: String, required: true },
            license_number: { type: String }
        },
        site_snapshot: {
            siteCode: { type: String },
            name: { type: String },
            address: {
                line1: String,
                line2: String,
                city: String,
                state: String,
                zip: String
            },
            phone: String,
            hours: String
        },
        request_payload: {
            type: String, // Store Quest SOAP request XML for auditing/debugging
        },
        response_payload: {
            type: String, // Store Quest SOAP response XML for auditing/debugging
        },
        error_details: {
            type: String,
        },
        substance_results: [
            {
                substanceName: { type: String },
                result: { type: String }, // e.g., "Negative", "Positive", "Pending Review", "Cancelled"
                value: { type: String }
            }
        ],
        plain_text_report: {
            type: String,
        },
        report_pdf_base64: {
            type: String,
        },
        status_logs: [
            {
                status: { type: String },
                updatedAt: { type: Date, default: Date.now }
            }
        ],
        mro_verified: {
            type: Boolean,
            default: false
        },
        mro_name: {
            type: String,
        },
        test_result: {
            type: String, // "pass" | "fail" | "PHO" | "—"
            default: "—"
        }
    },
    { timestamps: true }
);

// Auto-generate a beautiful human-readable order number if not provided before validation
orderSchema.pre("validate", async function (next) {
    if (!this.order_number) {
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = Math.floor(1000 + Math.random() * 9000).toString(36).toUpperCase();
        this.order_number = `ASC-${timestamp}-${random}`;
    }
    next();
});

const Order = mongoose.model("Order", orderSchema);
export default Order;

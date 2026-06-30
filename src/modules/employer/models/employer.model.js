import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const locationSchema = new mongoose.Schema({
    location_name: { type: String, required: true },
    is_headquarters: { type: Boolean, default: false },
    street_address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zip: { type: String, required: true },
    local_contact_name: { type: String, default: "" },
    local_contact_phone: { type: String, default: "" },
    local_contact_email: { type: String, default: "" },
});

const employerSchema = new mongoose.Schema(
    {
        first_name: {
            type: String,
            required: [true, "First name is required"],
            trim: true,
        },
        last_name: {
            type: String,
            required: [true, "Last name is required"],
            trim: true,
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            lowercase: true,
            trim: true,
        },
        phone: {
            type: String,
            required: [true, "Phone number is required"],
            trim: true,
        },
        password: {
            type: String,
            required: [true, "Password is required"],
            minlength: 8,
            select: false,
        },
        role: {
            type: String,
            default: "employer",
            immutable: true,
        },
        title: {
            type: String,
            trim: true,
        },
        status: {
            type: String,
            enum: ["pending", "active", "suspended"],
            default: "pending",
        },
        isEmailVerified: {
            type: Boolean,
            default: false,
        },
        // Employer specific fields
        company_name: String,
        business_type: {
            type: String,
            enum: ["DOT", "NON-DOT"],
        },
        dot_number: {
            type: String,
            required: function () {
                return this.business_type === "DOT";
            },
        },
        address: String,
        timezone: {
            type: String,
            default: "UTC+05:30 — India (IST)",
        },
        language: {
            type: String,
            default: "English (US)",
        },
        legal_name: {
            type: String,
            default: "",
        },
        dba_name: {
            type: String,
            default: "",
        },
        industry: {
            type: String,
            default: "",
        },
        founded_year: {
            type: String,
            default: "",
        },
        usdot: {
            type: String,
            default: "",
        },
        mc_mx_number: {
            type: String,
            default: "",
        },
        contact_phone: {
            type: String,
            default: "",
        },
        contact_email: {
            type: String,
            default: "",
        },
        public_industry: {
            type: String,
            default: "",
        },
        hq_street: {
            type: String,
            default: "",
        },
        hq_suite: {
            type: String,
            default: "",
        },
        hq_city: {
            type: String,
            default: "",
        },
        hq_state: {
            type: String,
            default: "",
        },
        hq_zip: {
            type: String,
            default: "",
        },
        same_as_hq: {
            type: Boolean,
            default: true,
        },
        mail_street: {
            type: String,
            default: "",
        },
        mail_suite: {
            type: String,
            default: "",
        },
        mail_city: {
            type: String,
            default: "",
        },
        mail_state: {
            type: String,
            default: "",
        },
        mail_zip: {
            type: String,
            default: "",
        },
        labAccountDOT: {
            type: String,
            trim: true,
        },
        labAccountNonDOT: {
            type: String,
            trim: true,
        },
        locations: [locationSchema],
        // Audit and Stats fields
        last_modified_by: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "SuperAdmin",
        },
        last_modified_at: Date,
        suspension_reason: String,
        employee_count: {
            type: Number,
            default: 0,
        },
        total_orders: {
            type: Number,
            default: 0,
        },
        resetToken: String,
        resetTokenExpiry: Date,
        stripeCustomerId: {
            type: String,
            default: null,
        },
        require2FA: {
            type: Boolean,
            default: false,
        },
        sessionMinutes: {
            type: Number,
            default: 720,
        },
        ipAllowList: {
            type: String,
            default: "",
        },
        notificationsEnabled: {
            type: Boolean,
            default: true,
        },
        notificationPreferences: {
            type: Object,
            default: {
                email_order_placed: false,
                email_payment_confirmed: true,
                email_scheduling_link: true,
                email_appointment_scheduled: false,
                email_appointment_reminder: false,
                email_result_available: false,
                email_positive_alert: false,
                email_mro_review: false,
                email_weekly_digest: false,
                email_product_updates: false,
                sms_appointment_reminder: false,
                sms_result_available: true,
                sms_mro_urgent: true,
                inapp_all_events: false,
            }
        }
    },
    { timestamps: true }
);

// Hash password before saving
employerSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

// Compare passwords
employerSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

const Employer = mongoose.model("Employer", employerSchema);
export default Employer;

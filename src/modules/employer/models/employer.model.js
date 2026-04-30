import mongoose from "mongoose";
import bcrypt from "bcryptjs";

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

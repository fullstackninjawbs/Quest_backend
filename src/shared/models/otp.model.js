import mongoose from "mongoose";

const otpSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
        },
        otp_code: {
            type: String,
            required: true,
        },
        expires_at: {
            type: Date,
            required: true,
        },
        type: {
            type: String,
            enum: ["login", "reset", "signup"],
            required: true,
        },
        used: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

// Index to automatically delete expired OTPs
otpSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

const OTP = mongoose.model("OTP", otpSchema);
export default OTP;

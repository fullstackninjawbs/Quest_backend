import mongoose from "mongoose";

const employerAuditLogSchema = new mongoose.Schema(
    {
        employer_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Employer",
            required: true,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Employer", // Can reference Employer Admin or associated candidates/agents
            required: true,
        },
        userEmail: {
            type: String,
            required: true,
        },
        userName: {
            type: String,
            default: "",
        },
        role: {
            type: String,
            required: true,
        },
        actionType: {
            type: String, // e.g. "PROFILE.UPDATED", "LOGIN.SUCCESS", "PASSWORD.CHANGED", etc.
            required: true,
        },
        targetEntityId: {
            type: String,
            default: "N/A",
        },
        targetEntityType: {
            type: String, // e.g. "Profile", "Location", "Employee", "Order"
            default: "N/A",
        },
        ipAddress: {
            type: String,
        },
        details: {
            type: mongoose.Schema.Types.Mixed,
        },
    },
    { timestamps: true }
);

// Indexes for optimized searching and filtering
employerAuditLogSchema.index({ employer_id: 1, createdAt: -1 });
employerAuditLogSchema.index({ actionType: 1 });

const EmployerAuditLog = mongoose.model("EmployerAuditLog", employerAuditLogSchema);
export default EmployerAuditLog;

const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
    {
        employer_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Employer",
            required: true,
        },
        action: {
            type: String,
            enum: ["edit", "suspend", "delete"],
            required: true,
        },
        performed_by: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "SuperAdmin",
            required: true,
        },
        old_data: {
            type: Object,
        },
        new_data: {
            type: Object,
        },
        ip_address: {
            type: String,
        },
        timestamp: {
            type: Date,
            default: Date.now,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("AuditLog", auditLogSchema);

import EmployerAuditLog from "../models/auditLog.model.js";

/**
 * Helper to log employer admin/system actions asynchronously without blocking HTTP response flows
 */
export const logEmployerAudit = async ({
    req,
    employerId,
    actionType,
    targetEntityId = "N/A",
    targetEntityType = "N/A",
    details = {}
}) => {
    try {
        const userId = req?.user?._id || employerId;
        const userEmail = req?.user?.email || "system@asc.com";
        const userName = req?.user ? `${req.user.first_name || ""} ${req.user.last_name || ""}`.trim() : "System";
        const role = req?.user?.role || "SYSTEM";
        const ipAddress = req ? (req.ip || req.connection?.remoteAddress || "") : "127.0.0.1";

        await EmployerAuditLog.create({
            employer_id: employerId || req?.user?._id,
            userId,
            userEmail,
            userName,
            role,
            actionType,
            targetEntityId: targetEntityId?.toString() || "N/A",
            targetEntityType,
            ipAddress,
            details
        });
    } catch (err) {
        console.error("Failed to write employer audit log:", err);
    }
};

import EmployerAuditLog from "../models/auditLog.model.js";
import catchAsync from "../../../utils/catchAsync.js";

// @desc    Get audit logs for the authenticated employer admin
// @route   GET /api/v1/employer/audit-logs
// @access  Private (Employer Only)
export const getAuditLogs = catchAsync(async (req, res, next) => {
    const page = Number(req.query.pageNumber) || 1;
    const limit = Number(req.query.pageSize) || 25;
    const { actionType, keyword } = req.query;

    const query = { employer_id: req.user._id };

    if (actionType && actionType !== "All types") {
        if (actionType === "Profile Updates") {
            query.actionType = "PROFILE.UPDATED";
        } else if (actionType === "API Keys") {
            query.actionType = { $regex: "API_KEY", $options: "i" };
        } else if (actionType === "Sessions") {
            query.actionType = { $regex: "SESSION|LOGIN|PASSWORD", $options: "i" };
        } else {
            query.actionType = actionType;
        }
    }

    if (keyword) {
        query.$or = [
            { userEmail: { $regex: keyword, $options: "i" } },
            { userName: { $regex: keyword, $options: "i" } },
            { targetEntityId: { $regex: keyword, $options: "i" } },
            { actionType: { $regex: keyword, $options: "i" } }
        ];
    }

    const count = await EmployerAuditLog.countDocuments(query);
    const logs = await EmployerAuditLog.find(query)
        .sort({ createdAt: -1 })
        .skip(limit * (page - 1))
        .limit(limit);

    res.status(200).json({
        success: true,
        data: logs,
        page,
        pages: Math.ceil(count / limit),
        total: count
    });
});

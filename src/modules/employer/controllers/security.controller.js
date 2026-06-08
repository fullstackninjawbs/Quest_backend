import Employer from "../models/employer.model.js";
import Session from "../../../shared/models/session.model.js";
import LoginHistory from "../../../shared/models/loginHistory.model.js";
import catchAsync from "../../../utils/catchAsync.js";
import AppError from "../../../utils/AppError.js";

// Helper to format Date into localized string matching the UI
const formatDate = (date) => {
    if (!date) return "";
    return new Date(date).toLocaleString("en-US", {
        month: "numeric",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        hour12: true
    });
};

/**
 * @desc    Get Security Overview (settings, active sessions, and login history)
 * @route   GET /api/v1/employer/security
 * @access  Private (Employer Only)
 */
export const getSecurityOverview = catchAsync(async (req, res, next) => {
    const employer = await Employer.findById(req.user._id);
    if (!employer) {
        return next(new AppError("Employer account not found.", 404));
    }

    // Get current authorization token from headers
    let currentToken = "";
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
        currentToken = req.headers.authorization.split(" ")[1];
    }

    // Retrieve active sessions
    const activeSessions = await Session.find({ userId: req.user._id }).sort({ updatedAt: -1 });

    // Retrieve recent login history (limit to 10 entries)
    const historyList = await LoginHistory.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(10);

    // Map sessions to match the frontend expectations
    const mappedSessions = activeSessions.map(s => ({
        id: s._id.toString(),
        device: s.device,
        ip: s.ip,
        location: s.location,
        lastActive: formatDate(s.lastActive || s.updatedAt),
        isCurrent: s.token === currentToken,
        isMobile: s.isMobile
    }));

    // Map login history
    const mappedHistory = historyList.map(h => ({
        when: formatDate(h.createdAt),
        device: h.device,
        ip: h.ip,
        location: h.location,
        status: h.status
    }));

    res.status(200).json({
        success: true,
        data: {
            settings: {
                require2FA: employer.require2FA || false,
                sessionMinutes: String(employer.sessionMinutes || 720),
                ipAllowList: employer.ipAllowList || ""
            },
            sessions: mappedSessions,
            loginHistory: mappedHistory
        }
    });
});

/**
 * @desc    Update Security Policy Settings
 * @route   POST /api/v1/employer/security/settings
 * @access  Private (Employer Only)
 */
export const updateSecuritySettings = catchAsync(async (req, res, next) => {
    const { require2FA, sessionMinutes, ipAllowList } = req.body;

    const employer = await Employer.findById(req.user._id);
    if (!employer) {
        return next(new AppError("Employer account not found.", 404));
    }

    if (require2FA !== undefined) employer.require2FA = require2FA;
    if (sessionMinutes !== undefined) employer.sessionMinutes = parseInt(sessionMinutes, 10) || 720;
    if (ipAllowList !== undefined) employer.ipAllowList = ipAllowList;

    await employer.save();

    res.status(200).json({
        success: true,
        message: "Security settings saved successfully.",
        settings: {
            require2FA: employer.require2FA,
            sessionMinutes: String(employer.sessionMinutes),
            ipAllowList: employer.ipAllowList
        }
    });
});

/**
 * @desc    Revoke specific device session
 * @route   DELETE /api/v1/employer/security/sessions/:id
 * @access  Private (Employer Only)
 */
export const revokeSession = catchAsync(async (req, res, next) => {
    const sessionId = req.params.id;

    const session = await Session.findOne({ _id: sessionId, userId: req.user._id });
    if (!session) {
        return next(new AppError("Session not found or unauthorized.", 404));
    }

    // Revoke the session
    await Session.findByIdAndDelete(sessionId);

    res.status(200).json({
        success: true,
        message: "Session revoked successfully."
    });
});

/**
 * @desc    Revoke all other device sessions
 * @route   DELETE /api/v1/employer/security/sessions/others
 * @access  Private (Employer Only)
 */
export const revokeOtherSessions = catchAsync(async (req, res, next) => {
    // Get current authorization token from headers
    let currentToken = "";
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
        currentToken = req.headers.authorization.split(" ")[1];
    }

    if (!currentToken) {
        return next(new AppError("Not authenticated.", 401));
    }

    // Revoke all sessions except the current one
    await Session.deleteMany({
        userId: req.user._id,
        token: { $ne: currentToken }
    });

    res.status(200).json({
        success: true,
        message: "All other sessions successfully revoked."
    });
});

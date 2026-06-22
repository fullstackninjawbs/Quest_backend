import jwt from "jsonwebtoken";
import Employer from "../models/employer.model.js";
import AppError from "../../../utils/AppError.js";
import catchAsync from "../../../utils/catchAsync.js";
import { JWT_SECRET } from "../../../config/env.js";
import Session from "../../../shared/models/session.model.js";
import { parseUserAgent, getIpLocation } from "../../../utils/security.util.js";

/**
 * Specialized middleware for Employer authentication and authorization.
 * Verifies JWT and ensures the user has the 'employer' role.
 */
const employerAuth = catchAsync(async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer ")
    ) {
        token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
        return next(new AppError("Not authenticated. Please login as Employer.", 401));
    }

    let decoded;
    try {
        decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
        if (err.name === "TokenExpiredError") {
            return next(new AppError("Token expired. Please login again.", 401));
        }
        return next(new AppError("Invalid token. Please login again.", 401));
    }

    const user = await Employer.findById(decoded.id);
    if (!user) {
        return next(new AppError("User no longer exists.", 401));
    }

    // Role Check
    if (user.role !== "employer") {
        return next(new AppError("Access denied. Employer role required.", 403));
    }

    // Session Verification
    const session = await Session.findOne({ token, userId: user._id });
    if (!session) {
        // Backward compatibility: Auto-create session if token is valid but session record is missing
        let ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
        if (ip === "::1" || ip === "::ffff:127.0.0.1") ip = "127.0.0.1";
        const userAgent = req.headers['user-agent'] || '';
        const { device, isMobile } = parseUserAgent(userAgent);
        const location = getIpLocation(ip);
        
        await Session.create({
            userId: user._id,
            userModel: 'Employer',
            token,
            device,
            ip,
            location,
            isMobile
        });
    } else {
        // Update last active timestamp
        session.lastActive = new Date();
        await session.save();
    }

    req.user = user;
    next();
});

export default employerAuth;

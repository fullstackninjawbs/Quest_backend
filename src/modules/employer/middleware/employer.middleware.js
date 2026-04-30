import jwt from "jsonwebtoken";
import Employer from "../models/employer.model.js";
import AppError from "../../../utils/AppError.js";
import catchAsync from "../../../utils/catchAsync.js";
import { JWT_SECRET } from "../../../config/env.js";

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

    req.user = user;
    next();
});

export default employerAuth;

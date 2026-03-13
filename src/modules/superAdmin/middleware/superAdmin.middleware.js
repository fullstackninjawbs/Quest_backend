const jwt = require("jsonwebtoken");
const SuperAdmin = require("../models/superAdmin.model");
const AppError = require("../../../utils/AppError");
const catchAsync = require("../../../utils/catchAsync");
const { JWT_SECRET } = require("../../../config/env");

/**
 * Specialized middleware for Super Admin authentication and authorization.
 * Verifies JWT and ensures the user has the 'super_admin' role.
 */
const superAdminAuth = catchAsync(async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer ")
    ) {
        token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
        return next(new AppError("Not authenticated. Please login as Super Admin.", 401));
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

    const user = await SuperAdmin.findById(decoded.id);
    if (!user) {
        return next(new AppError("User no longer exists.", 401));
    }

    // Role Check
    if (user.role !== "super_admin") {
        return next(new AppError("Access denied. Super Admin role required.", 403));
    }

    req.user = user;
    next();
});

module.exports = superAdminAuth;

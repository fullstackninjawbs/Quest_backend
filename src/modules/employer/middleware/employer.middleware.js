const jwt = require("jsonwebtoken");
const Employer = require("../models/employer.model");
const AppError = require("../../../utils/AppError");
const catchAsync = require("../../../utils/catchAsync");
const { JWT_SECRET } = require("../../../config/env");

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

    const decoded = jwt.verify(token, JWT_SECRET);

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

module.exports = employerAuth;

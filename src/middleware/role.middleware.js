const AppError = require("../utils/AppError");

/**
 * Middleware to restrict access based on user roles
 * Should be used AFTER the protect middleware
 * @param  {...string} roles - Allowed roles (e.g., 'super_admin', 'employer')
 */
const restrictTo = (...roles) => {
    return (req, res, next) => {
        // roles = ['super_admin'], req.user.role = 'employer'
        if (!roles.includes(req.user.role)) {
            return next(
                new AppError("You do not have permission to perform this action", 403)
            );
        }
        next();
    };
};

module.exports = restrictTo;

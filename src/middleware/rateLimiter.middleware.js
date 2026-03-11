const rateLimit = require("express-rate-limit");

/**
 * Shared configuration for rate limiters
 */
const createLimiter = (max, minutes) => {
    return rateLimit({
        windowMs: minutes * 60 * 1000,
        max: max,
        message: {
            status: "fail",
            message: `Too many attempts, please try again after ${minutes} minutes.`,
        },
        standardHeaders: true,
        legacyHeaders: false,
    });
};

exports.loginLimiter = createLimiter(5, 2);
exports.signupLimiter = createLimiter(3, 2);
exports.otpLimiter = createLimiter(3, 2);
exports.forgotPasswordLimiter = createLimiter(3, 2);

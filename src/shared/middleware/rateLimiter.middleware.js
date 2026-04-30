import rateLimit from "express-rate-limit";

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

export const loginLimiter = createLimiter(5, 2);
export const signupLimiter = createLimiter(3, 2);
export const otpLimiter = createLimiter(3, 2);
export const forgotPasswordLimiter = createLimiter(3, 2);

// General API Rate Limiter
export const apiLimiter = createLimiter(100, 15); // 100 requests per 15 mins

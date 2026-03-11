const express = require("express");
const router = express.Router();
const {
    signup,
    verifyOTP,
    login,
    forgotPassword,
    resetPassword,
    resendOTP,
    otpStatus,
    getMe,
    logout,
} = require("../controllers/auth.controller");
const { validateBody } = require("../middleware/validate.middleware");
const protect = require("../middleware/auth.middleware");
const {
    registerSchema,
    loginSchema,
    otpSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
} = require("../validators/auth.validator");
const {
    signupLimiter,
    loginLimiter,
    otpLimiter,
    forgotPasswordLimiter,
} = require("../middleware/rateLimiter.middleware");

router.post("/signup", signupLimiter, validateBody(registerSchema), signup);
router.post("/verify-otp", otpLimiter, validateBody(otpSchema), verifyOTP);
router.post("/login", loginLimiter, validateBody(loginSchema), login);
router.post(
    "/forgot-password",
    forgotPasswordLimiter,
    validateBody(forgotPasswordSchema),
    forgotPassword
);
router.post(
    "/reset-password",
    validateBody(resetPasswordSchema),
    resetPassword
);
router.post(
    "/resend-otp",
    validateBody(forgotPasswordSchema), // same payload {email}
    resendOTP
);
router.post(
    "/otp-status",
    validateBody(forgotPasswordSchema), // same payload {email}
    otpStatus
);
router.get("/me", protect, getMe);
router.post("/logout", protect, logout);

module.exports = router;


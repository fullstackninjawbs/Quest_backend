const express = require("express");
const router = express.Router();
const {
    signup,
    verifyOTP,
    login,
    forgotPassword,
    resetPassword,
    getMe,
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
router.get("/me", protect, getMe);

module.exports = router;


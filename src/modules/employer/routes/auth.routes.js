const express = require("express");
const router = express.Router();
const {
    signup,
    login,
    verifyOTP,
    resendOTP,
    otpStatus,
    forgotPassword,
    resetPassword,
    logout,
    getMe
} = require("../controllers/auth.controller");
const employerAuth = require("../middleware/employer.middleware");
const validate = require("../../../shared/middleware/validate.middleware");
const employerValidator = require("../validators/employer.validator");

// Public auth routes
router.post("/employer-signup", validate(employerValidator.registerSchema), signup);
router.post("/employer-login", validate(employerValidator.loginSchema), login);
router.post("/employer-verify", validate(employerValidator.otpSchema), verifyOTP);
router.post("/employer-resend", validate(employerValidator.forgotPasswordSchema), resendOTP);
router.post("/employer-otp", validate(employerValidator.forgotPasswordSchema), otpStatus);
router.post("/employer-forgot", validate(employerValidator.forgotPasswordSchema), forgotPassword);
router.post("/employer-reset", validate(employerValidator.resetPasswordSchema), resetPassword);

// Private auth routes
router.use(employerAuth);
router.post("/employer-logout", logout);
router.get("/employer-me", getMe);

module.exports = router;

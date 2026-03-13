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
router.post("/signup", validate(employerValidator.registerSchema), signup);
router.post("/login", validate(employerValidator.loginSchema), login);
router.post("/verify", validate(employerValidator.otpSchema), verifyOTP);
router.post("/resend", validate(employerValidator.forgotPasswordSchema), resendOTP);
router.post("/otp", validate(employerValidator.forgotPasswordSchema), otpStatus);
router.post("/forgot", validate(employerValidator.forgotPasswordSchema), forgotPassword);
router.post("/reset", validate(employerValidator.resetPasswordSchema), resetPassword);

// Private auth routes
router.use(employerAuth);
router.post("/logout", logout);
router.get("/me", getMe);

module.exports = router;

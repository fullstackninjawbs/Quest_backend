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
const superAdminAuth = require("../middleware/superAdmin.middleware");
const validate = require("../../../shared/middleware/validate.middleware");
const adminValidator = require("../validators/superAdmin.validator");

// Public auth routes
router.post("/signup", validate(adminValidator.registerSchema), signup);
router.post("/login", validate(adminValidator.loginSchema), login);
router.post("/verify", validate(adminValidator.otpSchema), verifyOTP);
router.post("/resend", validate(adminValidator.forgotPasswordSchema), resendOTP);
router.post("/otp", validate(adminValidator.forgotPasswordSchema), otpStatus);
router.post("/forgot", validate(adminValidator.forgotPasswordSchema), forgotPassword);
router.post("/reset", validate(adminValidator.resetPasswordSchema), resetPassword);

// Private auth routes
router.use(superAdminAuth);
router.post("/logout", logout);
router.get("/me", getMe);

module.exports = router;

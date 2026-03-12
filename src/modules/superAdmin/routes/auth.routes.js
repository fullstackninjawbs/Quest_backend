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
router.post("/superadmin-signup", validate(adminValidator.registerSchema), signup);
router.post("/superadmin-login", validate(adminValidator.loginSchema), login);
router.post("/superadmin-verify", validate(adminValidator.otpSchema), verifyOTP);
router.post("/superadmin-resend", validate(adminValidator.forgotPasswordSchema), resendOTP);
router.post("/superadmin-otp", validate(adminValidator.forgotPasswordSchema), otpStatus);
router.post("/superadmin-forgot", validate(adminValidator.forgotPasswordSchema), forgotPassword);
router.post("/superadmin-reset", validate(adminValidator.resetPasswordSchema), resetPassword);

// Private auth routes
router.use(superAdminAuth);
router.post("/superadmin-logout", logout);
router.get("/superadmin-me", getMe);

module.exports = router;

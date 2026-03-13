const express = require("express");
const router = express.Router();
const {
    login,
    verifyOTP,
    resendOTP,
    otpStatus,
    forgotPassword,
    resetPassword,
    logout,
    getMe,
    changePassword
} = require("../controllers/auth.controller");
const superAdminAuth = require("../middleware/superAdmin.middleware");
const validate = require("../../../shared/middleware/validate.middleware");
const adminValidator = require("../validators/superAdmin.validator");

// Public auth routes
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
router.post("/change-password", changePassword);

module.exports = router;

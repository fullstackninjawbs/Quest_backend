import express from "express";
const router = express.Router();
import {
    login,
    verifyOTP,
    resendOTP,
    otpStatus,
    forgotPassword,
    resetPassword,
    logout,
    getMe,
    changePassword
} from "../controllers/auth.controller.js";
import superAdminAuth from "../middleware/superAdmin.middleware.js";
import validate from "../../../shared/middleware/validate.middleware.js";
import * as adminValidator from "../validators/superAdmin.validator.js";

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

export default router;

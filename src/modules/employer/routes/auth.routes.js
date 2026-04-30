import express from "express";
const router = express.Router();
import {
    signup,
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
import employerAuth from "../middleware/employer.middleware.js";
import validate from "../../../shared/middleware/validate.middleware.js";
import * as employerValidator from "../validators/employer.validator.js";

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
router.post("/change-password", changePassword);

export default router;

const express = require("express");
const router = express.Router();
const {
    register,
    verifyOTP,
    login,
} = require("../controllers/auth.controller");
const { validateBody } = require("../middleware/validate.middleware");
const {
    registerSchema,
    loginSchema,
    otpSchema,
} = require("../validators/auth.validator");

router.post("/register", validateBody(registerSchema), register);
router.post("/verify-otp", validateBody(otpSchema), verifyOTP);
router.post("/login", validateBody(loginSchema), login);

module.exports = router;

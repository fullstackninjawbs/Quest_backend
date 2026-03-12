const authService = require("../../../services/auth.service");
const catchAsync = require("../../../utils/catchAsync");

// @desc    Employer Signup
// @route   POST /api/v1/employer/auth/signup
// @access  Public
exports.signup = catchAsync(async (req, res, next) => {
    // Inject the role for safety or handle it in service
    const signupData = { ...req.body, role: "employer" };
    const result = await authService.registerUser(signupData);

    res.status(201).json({
        success: true,
        ...result,
    });
});

// @desc    Login Employer
// @route   POST /api/v1/employer/auth/login
// @access  Public
exports.login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;
    const result = await authService.loginUser(email, password);

    // Verify role matches
    if (result.user.role !== "employer") {
        return res.status(403).json({
            success: false,
            message: "Unauthorized. This portal is for Employers only."
        });
    }

    res.status(200).json({
        success: true,
        ...result,
    });
});

// @desc    Verify OTP for Employer
// @route   POST /api/v1/employer/auth/verify-otp
exports.verifyOTP = catchAsync(async (req, res, next) => {
    const { email, otp } = req.body;
    const result = await authService.verifyOTP(email, otp);

    res.status(200).json({
        success: true,
        ...result,
    });
});

// @desc    Resend OTP for Employer
// @route   POST /api/v1/employer/auth/resend-otp
exports.resendOTP = catchAsync(async (req, res, next) => {
    const { email } = req.body;
    const result = await authService.resendOTP(email);

    res.status(200).json({
        success: true,
        ...result,
    });
});

// @desc    OTP Status for Employer
// @route   POST /api/v1/employer/auth/otp-status
exports.otpStatus = catchAsync(async (req, res, next) => {
    const { email } = req.body;
    const result = await authService.otpStatus(email);

    res.status(200).json({
        success: true,
        ...result,
    });
});

// @desc    Forgot Password for Employer
// @route   POST /api/v1/employer/auth/forgot-password
exports.forgotPassword = catchAsync(async (req, res, next) => {
    const { email } = req.body;
    const result = await authService.forgotPassword(email);

    res.status(200).json({
        success: true,
        ...result,
    });
});

// @desc    Reset Password for Employer
// @route   POST /api/v1/employer/auth/reset-password
exports.resetPassword = catchAsync(async (req, res, next) => {
    const { email, otp, password } = req.body;
    const result = await authService.resetPassword(email, otp, password);

    res.status(200).json({
        success: true,
        ...result,
    });
});

// @desc    Logout Employer
// @route   POST /api/v1/employer/auth/logout
exports.logout = catchAsync(async (req, res, next) => {
    res.status(200).json({
        success: true,
        message: "Employer logged out successfully.",
    });
});

// @desc    Get Current Employer
// @route   GET /api/v1/employer/auth/me
exports.getMe = catchAsync(async (req, res, next) => {
    res.status(200).json({
        success: true,
        user: req.user,
    });
});

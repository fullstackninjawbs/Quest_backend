const authService = require("../services/auth.service");
const catchAsync = require("../utils/catchAsync");

// @desc    Register a new employer
// @route   POST /api/v1/auth/signup
// @access  Public
exports.signup = catchAsync(async (req, res, next) => {
    const result = await authService.registerUser(req.body);

    res.status(201).json({
        success: true,
        ...result,
    });
});

// @desc    Verify OTP
// @route   POST /api/v1/auth/verify-otp
// @access  Public
exports.verifyOTP = catchAsync(async (req, res, next) => {
    const { email, otp } = req.body;
    const result = await authService.verifyOTP(email, otp);

    res.status(200).json({
        success: true,
        ...result,
    });
});

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
exports.login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;
    const result = await authService.loginUser(email, password);

    res.status(200).json({
        success: true,
        ...result,
    });
});

// @desc    Forgot Password
// @route   POST /api/v1/auth/forgot-password
// @access  Public
exports.forgotPassword = catchAsync(async (req, res, next) => {
    const { email } = req.body;
    const result = await authService.forgotPassword(email);

    res.status(200).json({
        success: true,
        ...result,
    });
});

// @desc    Reset Password
// @route   POST /api/v1/auth/reset-password
// @access  Public
exports.resetPassword = catchAsync(async (req, res, next) => {
    const { email, otp, password } = req.body;
    const result = await authService.resetPassword(email, otp, password);

    res.status(200).json({
        success: true,
        ...result,
    });
});

// @desc    Get current user info
// @route   GET /api/v1/auth/me
// @access  Private
exports.getMe = catchAsync(async (req, res, next) => {
    res.status(200).json({
        success: true,
        user: req.user,
    });
});

// @desc    Logout (works for both super_admin and employer)
// @route   POST /api/v1/auth/logout
// @access  Private
exports.logout = catchAsync(async (req, res, next) => {
    res.status(200).json({
        success: true,
        message: "Logged out successfully.",
    });
});

// @desc    Resend OTP
// @route   POST /api/v1/auth/resend-otp
// @access  Public
exports.resendOTP = catchAsync(async (req, res, next) => {
    const { email } = req.body;
    const result = await authService.resendOTP(email);

    res.status(200).json({
        success: true,
        ...result,
    });
});

// @desc    Get OTP Status (for timer resumption)
// @route   POST /api/v1/auth/otp-status
// @access  Public
exports.otpStatus = catchAsync(async (req, res, next) => {
    const { email } = req.body;
    const result = await authService.otpStatus(email);

    res.status(200).json({
        success: true,
        ...result,
    });
});

const authService = require("../services/auth.service");
const catchAsync = require("../utils/catchAsync");

// @desc    Register a new user
// @route   POST /api/v1/auth/register
// @access  Public
exports.register = catchAsync(async (req, res, next) => {
    const { name, email, password } = req.body;
    const result = await authService.registerUser(name, email, password);

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
    const result = await authService.verifyUserOTP(email, otp);

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

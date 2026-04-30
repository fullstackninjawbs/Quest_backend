import * as authService from "../../../services/auth.service.js";
import catchAsync from "../../../utils/catchAsync.js";

// @desc    Super Admin Signup
// @route   POST /api/v1/super-admin/auth/signup
// @access  Public
export const signup = catchAsync(async (req, res, next) => {
    // Inject the role for safety or handle it in service
    const signupData = { ...req.body, role: "super_admin" };
    const result = await authService.registerUser(signupData);

    res.status(201).json({
        success: true,
        ...result,
    });
});

// @desc    Login Super Admin
// @route   POST /api/v1/super-admin/auth/login
// @access  Public
export const login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;
    const result = await authService.loginUser(email, password);

    // Verify role matches
    if (result.user.role !== "super_admin") {
        return res.status(403).json({
            success: false,
            message: "Unauthorized. This portal is for Super Admins only."
        });
    }

    res.status(200).json({
        success: true,
        ...result,
    });
});

// @desc    Verify OTP for Super Admin
// @route   POST /api/v1/super-admin/auth/verify-otp
export const verifyOTP = catchAsync(async (req, res, next) => {
    const { email, otp } = req.body;
    const result = await authService.verifyOTP(email, otp);

    res.status(200).json({
        success: true,
        ...result,
    });
});

// @desc    Resend OTP for Super Admin
// @route   POST /api/v1/super-admin/auth/resend-otp
export const resendOTP = catchAsync(async (req, res, next) => {
    const { email } = req.body;
    const result = await authService.resendOTP(email);

    res.status(200).json({
        success: true,
        ...result,
    });
});

// @desc    OTP Status for Super Admin
// @route   POST /api/v1/super-admin/auth/otp-status
export const otpStatus = catchAsync(async (req, res, next) => {
    const { email } = req.body;
    const result = await authService.otpStatus(email);

    res.status(200).json({
        success: true,
        ...result,
    });
});

// @desc    Forgot Password for Super Admin
// @route   POST /api/v1/super-admin/auth/forgot-password
export const forgotPassword = catchAsync(async (req, res, next) => {
    const { email } = req.body;
    const result = await authService.forgotPassword(email);

    res.status(200).json({
        success: true,
        ...result,
    });
});

// @desc    Reset Password for Super Admin
// @route   POST /api/v1/super-admin/auth/reset-password
export const resetPassword = catchAsync(async (req, res, next) => {
    const { email, otp, password } = req.body;
    const result = await authService.resetPassword(email, otp, password);

    res.status(200).json({
        success: true,
        ...result,
    });
});

// @desc    Logout Super Admin
// @route   POST /api/v1/super-admin/auth/logout
export const logout = catchAsync(async (req, res, next) => {
    res.status(200).json({
        success: true,
        message: "Super Admin logged out successfully.",
    });
});

// @desc    Get Current Super Admin
// @route   GET /api/v1/super-admin/auth/me
export const getMe = catchAsync(async (req, res, next) => {
    res.status(200).json({
        success: true,
        user: req.user,
    });
});

// @desc    Change Password for Super Admin
// @route   POST /api/v1/super-admin/auth/change-password
export const changePassword = catchAsync(async (req, res, next) => {
    const result = await authService.changePassword(
        req.user._id,
        "super_admin",
        req.body
    );

    res.status(200).json({
        success: true,
        ...result,
    });
});

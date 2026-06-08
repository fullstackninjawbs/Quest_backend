import * as authService from "../../../services/auth.service.js";
import catchAsync from "../../../utils/catchAsync.js";
import Session from "../../../shared/models/session.model.js";
import LoginHistory from "../../../shared/models/loginHistory.model.js";
import { parseUserAgent, getIpLocation } from "../../../utils/security.util.js";
import Employer from "../models/employer.model.js";

// @desc    Employer Signup
// @route   POST /api/v1/employer/auth/signup
// @access  Public
export const signup = catchAsync(async (req, res, next) => {
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
export const login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;
    
    const clientIp = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const { device, isMobile } = parseUserAgent(req.headers['user-agent']);
    const location = getIpLocation(clientIp);

    try {
        const result = await authService.loginUser(email, password);

        // Verify role matches
        if (result.user.role !== "employer") {
            return res.status(403).json({
                success: false,
                message: "Unauthorized. This portal is for Employers only."
            });
        }

        // Create Session
        await Session.create({
            userId: result.user.id,
            userModel: 'Employer',
            token: result.token,
            device,
            ip: clientIp,
            location,
            isMobile
        });

        // Create Login History (Success)
        await LoginHistory.create({
            userId: result.user.id,
            userModel: 'Employer',
            device,
            ip: clientIp,
            location,
            status: 'Success'
        });

        res.status(200).json({
            success: true,
            ...result,
        });
    } catch (err) {
        // Find user if exists to log failed attempt
        try {
            const userMatch = await Employer.findOne({ email });
            if (userMatch) {
                await LoginHistory.create({
                    userId: userMatch._id,
                    userModel: 'Employer',
                    device,
                    ip: clientIp,
                    location,
                    status: 'Fail'
                });
            }
        } catch (_) {}
        
        throw err;
    }
});

// @desc    Verify OTP for Employer
// @route   POST /api/v1/employer/auth/verify-otp
export const verifyOTP = catchAsync(async (req, res, next) => {
    const { email, otp } = req.body;
    const result = await authService.verifyOTP(email, otp);

    res.status(200).json({
        success: true,
        ...result,
    });
});

// @desc    Resend OTP for Employer
// @route   POST /api/v1/employer/auth/resend-otp
export const resendOTP = catchAsync(async (req, res, next) => {
    const { email } = req.body;
    const result = await authService.resendOTP(email);

    res.status(200).json({
        success: true,
        ...result,
    });
});

// @desc    OTP Status for Employer
// @route   POST /api/v1/employer/auth/otp-status
export const otpStatus = catchAsync(async (req, res, next) => {
    const { email } = req.body;
    const result = await authService.otpStatus(email);

    res.status(200).json({
        success: true,
        ...result,
    });
});

// @desc    Forgot Password for Employer
// @route   POST /api/v1/employer/auth/forgot-password
export const forgotPassword = catchAsync(async (req, res, next) => {
    const { email } = req.body;
    const result = await authService.forgotPassword(email);

    res.status(200).json({
        success: true,
        ...result,
    });
});

// @desc    Reset Password for Employer
// @route   POST /api/v1/employer/auth/reset-password
export const resetPassword = catchAsync(async (req, res, next) => {
    const { email, otp, password } = req.body;
    const result = await authService.resetPassword(email, otp, password);

    res.status(200).json({
        success: true,
        ...result,
    });
});

// @desc    Forgot Password with Link for Employer
// @route   POST /api/v1/employer/auth/forgot-password-link
export const forgotPasswordLink = catchAsync(async (req, res, next) => {
    const { email } = req.body;
    const result = await authService.forgotPasswordWithLink(email);

    res.status(200).json({
        success: true,
        ...result,
    });
});

// @desc    Reset Password with Link for Employer
// @route   POST /api/v1/employer/auth/reset-password-link
export const resetPasswordLink = catchAsync(async (req, res, next) => {
    const { token, password } = req.body;
    const result = await authService.resetPasswordWithToken(token, password);

    res.status(200).json({
        success: true,
        ...result,
    });
});

// @desc    Logout Employer
// @route   POST /api/v1/employer/auth/logout
export const logout = catchAsync(async (req, res, next) => {
    let token = "";
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
        token = req.headers.authorization.split(" ")[1];
    }
    
    if (token) {
        await Session.deleteOne({ token });
    }

    res.status(200).json({
        success: true,
        message: "Employer logged out successfully.",
    });
});

// @desc    Get Current Employer
// @route   GET /api/v1/employer/auth/me
export const getMe = catchAsync(async (req, res, next) => {
    res.status(200).json({
        success: true,
        user: req.user,
    });
});

// @desc    Change Password for Employer
// @route   POST /api/v1/employer/auth/change-password
export const changePassword = catchAsync(async (req, res, next) => {
    const result = await authService.changePassword(
        req.user._id,
        "employer",
        req.body
    );

    res.status(200).json({
        success: true,
        ...result,
    });
});

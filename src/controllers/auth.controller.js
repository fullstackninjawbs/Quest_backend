const User = require("../models/user.model");
const {
    generateToken,
    hashOTP,
    generateOTP,
} = require("../utils/token.util");
const AppError = require("../utils/AppError");
const catchAsync = require("../utils/catchAsync");
const { sendEmail } = require("../services/email.service");

// @desc    Register a new user
// @route   POST /api/v1/auth/register
// @access  Public
exports.register = catchAsync(async (req, res, next) => {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) return next(new AppError("Email already in use", 400));

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const user = await User.create({
        name,
        email,
        password,
        otp: hashOTP(otp),
        otpExpiry,
    });

    await sendEmail({
        to: email,
        subject: "Email Verification OTP",
        text: `Your OTP is: ${otp}. It expires in 10 minutes.`,
    });

    res.status(201).json({
        success: true,
        message: "User registered. Please verify your email.",
    });
});

// @desc    Verify OTP
// @route   POST /api/v1/auth/verify-otp
// @access  Public
exports.verifyOTP = catchAsync(async (req, res, next) => {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });
    if (!user || !user.otp || user.otpExpiry < Date.now()) {
        return next(new AppError("OTP expired or invalid", 400));
    }

    if (user.otp !== hashOTP(otp)) {
        return next(new AppError("Incorrect OTP", 400));
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save({ validateBeforeSave: false });

    res
        .status(200)
        .json({ success: true, message: "Email verified. Please log in." });
});

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
exports.login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.comparePassword(password))) {
        return next(new AppError("Invalid email or password", 401));
    }

    if (!user.isVerified) {
        return next(new AppError("Please verify your email first", 403));
    }

    const token = generateToken(user._id);

    res.status(200).json({ success: true, token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
});

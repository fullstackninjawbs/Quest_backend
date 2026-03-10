const User = require("../models/user.model");
const {
    generateToken,
    hashOTP,
    generateOTP,
} = require("../utils/token.util");
const AppError = require("../utils/AppError");
const { sendEmail } = require("./email.service");

/**
 * Register a new user and send verification email.
 */
const registerUser = async (name, email, password) => {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        throw new AppError("Email already in use", 400);
    }

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await User.create({
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

    return { message: "User registered. Please verify your email." };
};

/**
 * Verify user's OTP and update verification status.
 */
const verifyUserOTP = async (email, otp) => {
    const user = await User.findOne({ email });
    if (!user || !user.otp || user.otpExpiry < Date.now()) {
        throw new AppError("OTP expired or invalid", 400);
    }

    if (user.otp !== hashOTP(otp)) {
        throw new AppError("Incorrect OTP", 400);
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save({ validateBeforeSave: false });

    return { message: "Email verified. Please log in." };
};

/**
 * Validate user credentials and generate JWT token.
 */
const loginUser = async (email, password) => {
    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.comparePassword(password))) {
        throw new AppError("Invalid email or password", 401);
    }

    if (!user.isVerified) {
        throw new AppError("Please verify your email first", 403);
    }

    const token = generateToken(user._id);

    return {
        token,
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
        },
    };
};

module.exports = {
    registerUser,
    verifyUserOTP,
    loginUser,
};

const User = require("../models/user.model");
const OTP = require("../models/otp.model");
const { generateToken, generateOTP, hashOTP } = require("../utils/token.util");
const AppError = require("../utils/AppError");
const { sendEmail } = require("./email.service");
const emailTemplates = require("../utils/emailTemplates");


/**
 * Register a new Employer
 */
const registerUser = async (userData) => {
    const { email, password } = userData;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        throw new AppError("Email already in use", 400);
    }

    const user = await User.create({
        ...userData,
        role: "employer",
        status: "pending",
    });

    const otp = generateOTP();
    await OTP.create({
        email,
        otp_code: hashOTP(otp),
        expires_at: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
        type: "signup",
    });

    console.log(`\n>>> VERIFICATION OTP FOR ${email}: ${otp} <<<\n`);


    await sendEmail({
        to: email,
        name: userData.name,
        subject: "Welcome to Asc Quest - Verify your Email",
        text: `Your verification OTP is: ${otp}`,
        html: emailTemplates.signupVerification(userData.name, otp),
    });

    return { message: "Employer registered. Please verify your email." };
};

/**
 * Verify OTP (Signup, Login, or Reset)
 */
const verifyOTP = async (email, otp, type) => {
    const otpRecord = await OTP.findOne({
        email,
        type,
        used: false,
        expires_at: { $gt: Date.now() },
    });

    if (!otpRecord || otpRecord.otp_code !== hashOTP(otp)) {
        throw new AppError("Invalid or expired OTP", 400);
    }

    otpRecord.used = true;
    await otpRecord.save();

    const user = await User.findOne({ email });
    if (!user) throw new AppError("User not found", 404);

    if (type === "signup") {
        user.isEmailVerified = true;
        await user.save();

        return {
            message: "Email verified successfully. Please log in.",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                status: user.status,
            },
        };
    }

    const token = generateToken(user._id);

    return {
        token,
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            status: user.status,
        },
    };
};

/**
 * Login logic
 */
const loginUser = async (email, password) => {
    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.comparePassword(password))) {
        throw new AppError("Invalid email or password", 401);
    }

    if (user.role === "employer" && !user.isEmailVerified) {
        throw new AppError("Please verify your email first", 403);
    }

    // 4. Generate Token
    const token = generateToken(user._id);

    return {
        token,
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            status: user.status,
        },
    };
};

/**
 * Forgot Password
 */
const forgotPassword = async (email) => {
    const user = await User.findOne({ email });
    if (!user) {
        // Don't leak user existence in production, but here we'll be helpful
        throw new AppError("User with this email does not exist", 404);
    }

    const otp = generateOTP();
    await OTP.create({
        email,
        otp_code: hashOTP(otp),
        expires_at: new Date(Date.now() + 10 * 60 * 1000),
        type: "reset",
    });

    console.log(`\n>>> RESET OTP FOR ${email}: ${otp} <<<\n`);


    await sendEmail({
        to: email,
        name: user.name,
        subject: "Password Reset OTP - Asc Quest",
        text: `Your password reset OTP is: ${otp}`,
        html: emailTemplates.passwordResetOTP(otp),
    });

    return { message: "Password reset OTP sent." };
};

/**
 * Reset Password
 */
const resetPassword = async (email, otp, newPassword) => {
    const otpRecord = await OTP.findOne({
        email,
        type: "reset",
        used: false,
        expires_at: { $gt: Date.now() },
    });

    if (!otpRecord || otpRecord.otp_code !== hashOTP(otp)) {
        throw new AppError("Invalid or expired OTP", 400);
    }

    const user = await User.findOne({ email });
    if (!user) throw new AppError("User not found", 404);

    user.password = newPassword;
    await user.save();

    otpRecord.used = true;
    await otpRecord.save();

    const token = generateToken(user._id);

    return {
        message: "Password reset successfully.",
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
    verifyOTP,
    loginUser,
    forgotPassword,
    resetPassword,
};


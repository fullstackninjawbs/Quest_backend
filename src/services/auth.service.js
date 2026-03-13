const SuperAdmin = require("../modules/superAdmin/models/superAdmin.model");
const Employer = require("../modules/employer/models/employer.model");
const OTP = require("../shared/models/otp.model");
const { generateToken, generateOTP, hashOTP } = require("../utils/token.util");
const AppError = require("../utils/AppError");
const { sendEmail } = require("./email.service");
const emailTemplates = require("../utils/emailTemplates");

/**
 * Helper to get the correct model based on role
 */
const getModelByRole = (role) => {
    if (role === "super_admin") return SuperAdmin;
    if (role === "employer") return Employer;
    throw new AppError("Invalid role specified", 400);
};

/**
 * Helper to find a user in any collection by email
 */
const findUserAnywhere = async (email) => {
    const admin = await SuperAdmin.findOne({ email });
    if (admin) return { user: admin, role: "super_admin" };
    
    const employer = await Employer.findOne({ email });
    if (employer) return { user: employer, role: "employer" };
    
    return null;
};

/**
 * Register a new User (Employer or Super Admin)
 */
const registerUser = async (userData) => {
    const { email, password, confirmPassword, first_name, last_name, role } = userData;

    if (password !== confirmPassword) {
        throw new AppError("Passwords do not match", 400);
    }

    // Check if email exists in ANY collection
    const existing = await findUserAnywhere(email);
    if (existing) {
        throw new AppError("Email already in use", 400);
    }

    const Model = getModelByRole(role);
    const user = await Model.create({
        ...userData,
        status: role === "super_admin" ? "active" : "pending",
    });

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 2 * 60 * 1000);

    await OTP.deleteMany({ email });
    await OTP.create({
        email,
        otp_code: hashOTP(otp),
        expires_at: expiresAt,
        type: "signup",
    });

    console.log(`\n>>> VERIFICATION OTP FOR ${email}: ${otp} <<<\n`);

    const fullName = `${first_name} ${last_name}`;
    await sendEmail({
        to: email,
        name: fullName,
        otp: otp,
        subject: "Welcome to Asc Quest - Verify your Email",
        text: `Your verification OTP is: ${otp}`,
        html: emailTemplates.signupVerification(fullName, otp),
    });

    return {
        message: `${role === "super_admin" ? "Super Admin" : "Employer"} registered. Please verify your email.`,
        otpExpiresAt: expiresAt.toISOString(),
    };
};

/**
 * Verify OTP
 */
const verifyOTP = async (email, otp) => {
    const otpRecord = await OTP.findOne({
        email,
        used: false,
        expires_at: { $gt: Date.now() },
    }).sort({ createdAt: -1 });

    if (!otpRecord || otpRecord.otp_code !== hashOTP(otp)) {
        throw new AppError("Invalid or expired OTP", 400);
    }

    const type = otpRecord.type;
    const result = await findUserAnywhere(email);
    if (!result) throw new AppError("User not found", 404);
    
    const { user } = result;

    otpRecord.used = true;
    await otpRecord.save();

    if (type === "signup") {
        user.isEmailVerified = true;
        await user.save();

        return {
            message: "Email verified successfully. Please log in.",
            user: {
                id: user._id,
                first_name: user.first_name,
                last_name: user.last_name,
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
            first_name: user.first_name,
            last_name: user.last_name,
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
    const result = await findUserAnywhere(email);
    if (!result) {
        throw new AppError("Invalid email: User not found", 401);
    }

    const { user, role } = result;
    
    // We need the password field which is selected: false
    const Model = getModelByRole(role);
    const userWithPass = await Model.findById(user._id).select("+password");

    if (!userWithPass || !(await userWithPass.comparePassword(password))) {
        throw new AppError("Invalid password", 401);
    }

    if (role === "employer" && !userWithPass.isEmailVerified) {
        throw new AppError("Please verify your email first", 403);
    }

    const token = generateToken(userWithPass._id);

    return {
        token,
        user: {
            id: userWithPass._id,
            first_name: userWithPass.first_name,
            last_name: userWithPass.last_name,
            email: userWithPass.email,
            role: userWithPass.role,
            status: userWithPass.status,
        },
    };
};

/**
 * Forgot Password
 */
const forgotPassword = async (email) => {
    const result = await findUserAnywhere(email);
    if (!result) {
        throw new AppError("User with this email does not exist", 404);
    }

    const { user } = result;
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 2 * 60 * 1000);

    await OTP.deleteMany({ email });
    await OTP.create({
        email,
        otp_code: hashOTP(otp),
        expires_at: expiresAt,
        type: "reset",
    });

    console.log(`\n>>> RESET OTP FOR ${email}: ${otp} <<<\n`);

    const resetFullName = `${user.first_name} ${user.last_name}`;
    await sendEmail({
        to: email,
        name: resetFullName,
        otp: otp,
        subject: "Password Reset OTP - Asc Quest",
        text: `Your password reset OTP is: ${otp}`,
        html: emailTemplates.passwordResetOTP(otp),
    });

    return {
        message: "Password reset OTP sent.",
        otpExpiresAt: expiresAt.toISOString(),
    };
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

    const result = await findUserAnywhere(email);
    if (!result) throw new AppError("User not found", 404);
    
    const { user, role } = result;
    const Model = getModelByRole(role);
    const userWithPass = await Model.findById(user._id).select("+password");

    userWithPass.password = newPassword;
    userWithPass.markModified("password"); // Force mongoose to see the change for hashing hook
    userWithPass.isEmailVerified = true; // Successfully resetting password via OTP verifies the email
    await userWithPass.save();

    otpRecord.used = true;
    await otpRecord.save();

    const token = generateToken(userWithPass._id);

    return {
        message: "Password reset successfully.",
        token,
        user: {
            id: userWithPass._id,
            first_name: userWithPass.first_name,
            last_name: userWithPass.last_name,
            email: userWithPass.email,
            role: userWithPass.role,
        },
    };
};

/**
 * Resend OTP
 */
const resendOTP = async (email) => {
    const result = await findUserAnywhere(email);
    if (!result) {
        throw new AppError("User not found", 404);
    }

    const { user } = result;
    const lastOtp = await OTP.findOne({ email }).sort({ createdAt: -1 });
    const type = lastOtp ? lastOtp.type : (user.isEmailVerified ? "reset" : "signup");
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 2 * 60 * 1000);

    await OTP.deleteMany({ email });
    await OTP.create({
        email,
        otp_code: hashOTP(otp),
        expires_at: expiresAt,
        type,
    });

    console.log(`\n>>> RESEND OTP FOR ${email} (${type}): ${otp} <<<\n`);

    const fullName = `${user.first_name} ${user.last_name}`;

    // Send appropriate email
    if (type === "signup") {
        await sendEmail({
            to: email,
            name: fullName,
            otp: otp,
            subject: "Welcome to Asc Quest - Verify your Email",
            text: `Your verification OTP is: ${otp}`,
            html: emailTemplates.signupVerification(fullName, otp),
        });
    } else {
        await sendEmail({
            to: email,
            name: fullName,
            otp: otp,
            subject: "Password Reset OTP - Asc Quest",
            text: `Your password reset OTP is: ${otp}`,
            html: emailTemplates.passwordResetOTP(otp),
        });
    }

    return {
        message: "OTP resent successfully.",
        otpExpiresAt: expiresAt.toISOString(),
    };
};

/**
 * OTP Status
 */
const otpStatus = async (email) => {
    const result = await findUserAnywhere(email);
    if (!result) {
        throw new AppError("User not found", 404);
    }

    const activeOtp = await OTP.findOne({
        email,
        used: false,
        expires_at: { $gt: Date.now() },
    }).sort({ createdAt: -1 });

    if (!activeOtp) {
        return { hasActiveOtp: false };
    }

    return {
        hasActiveOtp: true,
        otpExpiresAt: activeOtp.expires_at.toISOString(),
    };
};

module.exports = {
    registerUser,
    verifyOTP,
    loginUser,
    forgotPassword,
    resetPassword,
    resendOTP,
    otpStatus,
};


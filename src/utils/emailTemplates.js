/**
 * Professional HTML Email Templates for Asc Quest
 */

const baseStyle = `
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    color: #333;
    line-height: 1.6;
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
    border: 1px solid #eee;
    border-radius: 10px;
`;

const headerStyle = `
    background-color: #1a73e8;
    color: white;
    padding: 20px;
    text-align: center;
    border-radius: 10px 10px 0 0;
    margin: -20px -20px 20px -20px;
`;

const otpStyle = `
    font-size: 24px;
    font-weight: bold;
    color: #1a73e8;
    letter-spacing: 5px;
    text-align: center;
    margin: 20px 0;
    padding: 10px;
    background-color: #f8f9fa;
    border-radius: 5px;
`;

const footerStyle = `
    font-size: 12px;
    color: #888;
    margin-top: 30px;
    text-align: center;
`;

export const signupVerification = (name, otp) => `
    <div style="${baseStyle}">
        <div style="${headerStyle}">
            <h1>Welcome to Asc Quest</h1>
        </div>
        <p>Hello ${name},</p>
        <p>Thank you for signing up as an Employer on Asc Quest. To complete your registration, please use the following One-Time Password (OTP) to verify your email address:</p>
        <div style="${otpStyle}">${otp}</div>
        <p>This code will expire in 5 minutes. If you did not request this, please ignore this email.</p>
        <p>Best regards,<br>The Asc Quest Team</p>
        <div style="${footerStyle}">
            &copy; ${new Date().getFullYear()} Asc Quest. All rights reserved.
        </div>
    </div>
`;

export const loginOTP = (otp) => `
    <div style="${baseStyle}">
        <div style="${headerStyle}">
            <h1>Login Verification</h1>
        </div>
        <p>Hello,</p>
        <p>You are attempting to log in to your Asc Quest account. Use the following OTP to complete your login:</p>
        <div style="${otpStyle}">${otp}</div>
        <p>This code will expire in 5 minutes. For security reasons, do not share this code with anyone.</p>
        <p>Best regards,<br>The Asc Quest Team</p>
        <div style="${footerStyle}">
            &copy; ${new Date().getFullYear()} Asc Quest. All rights reserved.
        </div>
    </div>
`;

export const passwordResetOTP = (otp) => `
    <div style="${baseStyle}">
        <div style="${headerStyle}">
            <h1>Password Reset Request</h1>
        </div>
        <p>Hello,</p>
        <p>We received a request to reset your password. Use the following OTP to proceed with the reset:</p>
        <div style="${otpStyle}">${otp}</div>
        <p>This code will expire in 5 minutes. If you did not request a password reset, please secure your account.</p>
        <p>Best regards,<br>The Asc Quest Team</p>
        <div style="${footerStyle}">
            &copy; ${new Date().getFullYear()} Asc Quest. All rights reserved.
        </div>
    </div>
`;

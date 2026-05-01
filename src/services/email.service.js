import emailjs from "@emailjs/nodejs";
import nodemailer from "nodemailer";
import { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } from "../config/env.js";

// Configure Nodemailer
const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT == 465, // true for 465, false for other ports
    auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
    },
});

// Configure EmailJS
emailjs.init({
    publicKey: process.env.EMAILJS_PUBLIC_KEY,
    privateKey: process.env.EMAILJS_PRIVATE_KEY,
});

/**
 * Send an email.
 * @param {Object} options - { to, subject, text, html, templateParams, name }
 */
export const sendEmail = async ({ to, subject, text, html, templateParams, name, otp }) => {
    const isMailerTrue = process.env.MAILER === "true";

    if (isMailerTrue) {
        // ─── Nodemailer (Terminal Mode) ──────────────────────────────────────
        // Silence logging here; auth.service.js already logs the OTP for dev.
    } else {
        // ─── EmailJS Mode ─────────────────────────────────────────────────────
        try {
            console.log(`[EmailJS] Attempting to send template to ${to}...`);
            
            // Extract OTP from text if it wasn't passed explicitly
            const otpVal = otp || (text ? (text.match(/\d{6}/)?.[0] || "123456") : "123456");
            
            const params = templateParams || {
                name: name || "User",
                to_name: name || "User",
                email: to,
                to_email: to,
                user_email: to,
                otp: otpVal,
                otp_code: otpVal,
                code: otpVal,
                passcode: otpVal,      // Matches your template {{passcode}} !!
                time: "2 minutes",    // Matches your template {{time}} !!
                message: text || `Your OTP is ${otpVal}`,
                subject: subject,
                expiry_time: "2 minutes"
            };

            console.log("[EmailJS] Final Params being sent:", params);

            const response = await emailjs.send(
                process.env.EMAILJS_SERVICE_ID,
                process.env.EMAILJS_TEMPLATE_ID,
                params
            );
            console.log(`[EmailJS] Success! Status: ${response.status}, Text: ${response.text}`);
        } catch (error) {
            console.error("[EmailJS] Sending failed. Error text:", error.text || "No error text provided");
            console.error("[EmailJS] Full error object:", error);
            logFallback(to, subject, text || "EmailJS Params used");
        }
    }
};

/**
 * Send Password Reset Link Email via Nodemailer
 */
export const sendResetPasswordEmail = async (email, resetLink, name) => {
    const mailOptions = {
        from: `"Asc Quest" <${SMTP_USER}>`,
        to: email,
        subject: "Password Reset Link - Asc Quest",
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                <h2 style="color: #333; text-align: center;">Password Reset Request</h2>
                <p>Hello ${name},</p>
                <p>We received a request to reset your password for your Asc Quest account. Click the button below to reset it:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${resetLink}" style="background-color: #007bff; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
                </div>
                <p>This link will expire in 15 minutes. If you did not request a password reset, please ignore this email.</p>
                <p>Or copy and paste this link into your browser:</p>
                <p><a href="${resetLink}">${resetLink}</a></p>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="font-size: 12px; color: #777; text-align: center;">&copy; ${new Date().getFullYear()} Asc Quest. All rights reserved.</p>
            </div>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`[Nodemailer] Reset link sent to ${email}`);
    } catch (error) {
        console.error("[Nodemailer] Error sending reset link email:", error);
        throw error;
    }
};

const logFallback = (to, subject, content) => {
    console.log("--- EMAIL CONTENT (FALLBACK) ---");
    console.log("To:", to);
    console.log("Subject:", subject);
    console.log("Content:", content);
    console.log("------------------------------");
};

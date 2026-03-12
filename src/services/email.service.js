const emailjs = require("@emailjs/nodejs");

// Configure EmailJS
emailjs.init({
    publicKey: process.env.EMAILJS_PUBLIC_KEY,
    privateKey: process.env.EMAILJS_PRIVATE_KEY,
});

/**
 * Send an email.
 * @param {Object} options - { to, subject, text, html, templateParams, name }
 */
const sendEmail = async ({ to, subject, text, html, templateParams, name, otp }) => {
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
                time: "10 minutes",    // Matches your template {{time}} !!
                message: text || `Your OTP is ${otpVal}`,
                subject: subject,
                expiry_time: "10 minutes"
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

const logFallback = (to, subject, content) => {
    console.log("--- EMAIL CONTENT (FALLBACK) ---");
    console.log("To:", to);
    console.log("Subject:", subject);
    console.log("Content:", content);
    console.log("------------------------------");
};

module.exports = { sendEmail };

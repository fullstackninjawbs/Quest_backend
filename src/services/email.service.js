const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

/**
 * Send an email.
 * @param {Object} options - { to, subject, text, html }
 */
const sendEmail = async ({ to, subject, text, html }) => {
    try {
        await transporter.sendMail({
            from: `"Asc Quest" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            text,
            html,
        });
        console.log(`Email sent to ${to}: ${subject}`);
    } catch (error) {
        console.error("Email sending failed:", error.message);
        console.log("--- EMAIL CONTENT (MOCKED) ---");
        console.log("To:", to);
        console.log("Subject:", subject);
        console.log("Content:", text || "HTML Content provided");
        console.log("------------------------------");
    }
};

module.exports = { sendEmail };

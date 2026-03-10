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
    await transporter.sendMail({
        from: `"Asc Quest" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        text,
        html,
    });
};

module.exports = { sendEmail };

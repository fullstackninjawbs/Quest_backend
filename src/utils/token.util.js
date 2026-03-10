const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { JWT_SECRET, JWT_EXPIRES_IN } = require("../config/env");

/**
 * Generate a signed JWT for a given user ID.
 */
const generateToken = (userId) =>
    jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

/**
 * Generate a random 6-digit numeric OTP.
 */
const generateOTP = () =>
    Math.floor(100000 + Math.random() * 900000).toString();

/**
 * Hash an OTP using SHA-256 (for safe DB storage).
 */
const hashOTP = (otp) =>
    crypto.createHash("sha256").update(otp).digest("hex");

module.exports = { generateToken, generateOTP, hashOTP };

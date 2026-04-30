import jwt from "jsonwebtoken";
import crypto from "crypto";
import { JWT_SECRET, JWT_EXPIRES_IN } from "../config/env.js";

/**
 * Generate a signed JWT for a given user ID.
 */
export const generateToken = (userId) =>
    jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

/**
 * Generate a random 6-digit numeric OTP.
 */
export const generateOTP = () =>
    Math.floor(100000 + Math.random() * 900000).toString();

/**
 * Hash an OTP using SHA-256 (for safe DB storage).
 */
export const hashOTP = (otp) =>
    crypto.createHash("sha256").update(otp).digest("hex");

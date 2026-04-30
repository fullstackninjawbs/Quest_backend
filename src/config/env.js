import dotenv from "dotenv";
dotenv.config();

const requiredEnvVars = ["MONGO_URI", "JWT_SECRET", "PORT"];

requiredEnvVars.forEach((key) => {
    if (!process.env[key]) {
        throw new Error(`Missing required environment variable: ${key}`);
    }
});

export const NODE_ENV = process.env.NODE_ENV || "development";
export const PORT = parseInt(process.env.PORT, 10) || 5000;
export const MONGO_URI = process.env.MONGO_URI;
export const JWT_SECRET = process.env.JWT_SECRET;
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
export const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

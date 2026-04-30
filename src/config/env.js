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

// Quest Diagnostics Integration
export const QUEST_USERNAME = process.env.QUEST_USERNAME || "cli_AmericanScreeningUAT";
export const QUEST_PASSWORD = process.env.QUEST_PASSWORD || '83kAN6Nd6me6';
export const QUEST_SOAP_URL = process.env.QUEST_SOAP_URL;
export const QUEST_ACCOUNT_ID = process.env.QUEST_ACCOUNT_ID;

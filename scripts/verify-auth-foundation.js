import axios from "axios";
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load env vars
dotenv.config({ path: path.join(__dirname, "../.env") });

import OTP from "../src/shared/models/otp.model.js";
import Employer from "../src/modules/employer/models/employer.model.js";

const API_URL = "http://localhost:5001/api/v1/auth";

async function runTests() {
    try {
        console.log("Connecting to Database...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB.");

        const testEmail = `test_employer_${Date.now()}@example.com`;

        // 1. Signup
        console.log("\n--- Testing Signup ---");
        const signupRes = await axios.post(`${API_URL}/signup`, {
            first_name: "Test",
            last_name: "Employer",
            email: testEmail,
            password: "Password123!",
            confirmPassword: "Password123!",
            phone: "1234567890",
            company_name: "Test Corp",
            business_type: "NON-DOT",
            address: "123 Test St",
        });
        console.log("Signup Success:", signupRes.data.message);
        console.log("Signup OTP Expires At:", signupRes.data.otpExpiresAt);

        // 2. Test OTP Status
        console.log("\n--- Testing OTP Status ---");
        const statusRes = await axios.post(`${API_URL}/otp-status`, { email: testEmail });
        console.log("OTP Status Has Active OTP:", statusRes.data.hasActiveOtp);
        console.log("OTP Status Expires At:", statusRes.data.otpExpiresAt);

        // 3. Test Resend OTP
        console.log("\n--- Testing Resend OTP ---");
        const resendRes = await axios.post(`${API_URL}/resend-otp`, { email: testEmail });
        console.log("Resend OTP Success:", resendRes.data.message);
        console.log("Resend OTP Expires At:", resendRes.data.otpExpiresAt);

        // 4. Fetch the NEW Signup OTP from DB
        const signupOTP = await OTP.findOne({ email: testEmail, type: "signup" }).sort({ createdAt: -1 });
        console.log("New Signup OTP found in DB:", signupOTP ? "Yes" : "No");

        // 5. Verify Signup OTP
        console.log(`Manually inserting a known OTP for verification for email: ${testEmail}...`);
        const rawOTP = "123456";
        const hashOTP = (otp) => crypto.createHash("sha256").update(otp).digest("hex");

        const updateResult = await OTP.findOneAndUpdate(
            { email: testEmail, type: "signup" },
            { otp_code: hashOTP(rawOTP), expires_at: new Date(Date.now() + 500000) },
            { new: true }
        );
        console.log("OTP Update Result:", updateResult ? "Success" : "Failed (Record not found)");

        console.log("\n--- Testing OTP Verification ---");
        const verifyRes = await axios.post(`${API_URL}/verify-otp`, {
            email: testEmail,
            otp: rawOTP,
        });
        console.log("OTP Verification Success:", verifyRes.data.user.email);

        // 6. Login (Direct Token)
        console.log("\n--- Testing Login ---");
        const loginRes = await axios.post(`${API_URL}/login`, {
            email: testEmail,
            password: "Password123!"
        });
        const token = loginRes.data.token;
        console.log("Login Success. Token received:", token ? "Yes" : "No");

        // 7. Test GET /me
        console.log("\n--- Testing GET /me ---");
        const meRes = await axios.get(`${API_URL}/me`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log("Identity Verified:", meRes.data.user.email, "| Role:", meRes.data.user.role);

        // 8. Test Logout
        console.log("\n--- Testing Logout ---");
        const logoutRes = await axios.post(`${API_URL}/logout`, {}, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log("Logout Success:", logoutRes.data.message);

        // 9. Forgot Password
        console.log("\n--- Testing Forgot Password ---");
        const forgotRes = await axios.post(`${API_URL}/forgot-password`, { email: testEmail });
        console.log("Forgot Password Response:", forgotRes.data.message);
        console.log("Forgot Password Expires At:", forgotRes.data.otpExpiresAt);

        // 10. Test Another Resend OTP (for reset flow)
        console.log("\n--- Testing Resend OTP (Reset Flow) ---");
        const resendResetRes = await axios.post(`${API_URL}/resend-otp`, { email: testEmail });
        console.log("Resend Reset OTP Success:", resendResetRes.data.message);
        console.log("Resend Reset OTP Expires At:", resendResetRes.data.otpExpiresAt);

        // 11. Reset Password
        await OTP.findOneAndUpdate(
            { email: testEmail, type: "reset" },
            { otp_code: hashOTP(rawOTP), expires_at: new Date(Date.now() + 500000) }
        );

        console.log("\n--- Testing Reset Password ---");
        const resetRes = await axios.post(`${API_URL}/reset-password`, {
            email: testEmail,
            otp: rawOTP,
            password: "NewPassword123!"
        });
        console.log("Reset Success:", resetRes.data.message);

        // Clean up
        console.log("\nCleaning up test data...");
        await Employer.deleteOne({ email: testEmail });
        await OTP.deleteMany({ email: testEmail });
        console.log("Test data removed.");

        console.log("\nALL TESTS PASSED SUCCESSFULLY! ✅");

    } catch (error) {
        console.error("\nTEST FAILED ❌");
        if (error.response) {
            console.error("HTTP Error:");
            console.error("  Status:", error.response.status);
            console.error("  Data:", JSON.stringify(error.response.data, null, 2));
        } else if (error.request) {
            console.error("Network Error: No response received");
            console.error(error.message);
        } else {
            console.error("General Error:");
            console.error(error.message);
            console.error(error.stack);
        }
    } finally {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }
        process.exit();
    }
}

runTests();

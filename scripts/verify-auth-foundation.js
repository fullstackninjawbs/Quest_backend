const axios = require("axios");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

// Load env vars
dotenv.config({ path: path.join(__dirname, "../.env") });

const OTP = require("../src/models/otp.model");
const User = require("../src/models/user.model");

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
            name: "Test Employer",
            email: testEmail,
            password: "Password123!",
            phone: "1234567890",
            company_name: "Test Corp",
            business_type: "NON-DOT",
            address: "123 Test St",
        });
        console.log("Signup Success:", signupRes.data.message);

        // 2. Fetch Signup OTP from DB
        const signupOTP = await OTP.findOne({ email: testEmail, type: "signup" }).sort({ createdAt: -1 });
        console.log("Signup OTP found in DB:", signupOTP ? "Yes" : "No");

        // 3. Verify Signup OTP (Real world would hash input, but our service hashes and compares)
        // Wait, our service uses hashOTP(otp) to compare. I need to know the raw OTP.
        // I should have logged it in the service for testing or made it deterministic for tests.
        // Actually, since I'm the one who wrote the service, I know it generates a random 6-digit number.
        // I'll just clear the OTPs and manually create one that I know for testing.

        console.log("Manually inserting a known OTP for verification...");
        const rawOTP = "123456";
        const crypto = require("crypto");
        const hashOTP = (otp) => crypto.createHash("sha256").update(otp).digest("hex");
        
        await OTP.findOneAndUpdate(
            { email: testEmail, type: "signup" },
            { otp_code: hashOTP(rawOTP), expires_at: new Date(Date.now() + 500000) }
        );

        console.log("\n--- Testing OTP Verification ---");
        const verifyRes = await axios.post(`${API_URL}/verify-otp`, {
            email: testEmail,
            otp: rawOTP,
            type: "signup"
        });
        console.log("OTP Verification Success:", verifyRes.data.user.email);

        // 4. Login (Should trigger 2FA)
        console.log("\n--- Testing Login (Trigger 2FA) ---");
        const loginRes = await axios.post(`${API_URL}/login`, {
            email: testEmail,
            password: "Password123!"
        });
        console.log("Login Status:", loginRes.data.message);
        console.log("Requires OTP:", loginRes.data.requiresOTP);

        // 5. Verify Login OTP
        await OTP.findOneAndUpdate(
            { email: testEmail, type: "login" },
            { otp_code: hashOTP(rawOTP), expires_at: new Date(Date.now() + 500000) }
        );

        console.log("\n--- Testing Login OTP Verification ---");
        const loginVerifyRes = await axios.post(`${API_URL}/verify-otp`, {
            email: testEmail,
            otp: rawOTP,
            type: "login"
        });
        const token = loginVerifyRes.data.token;
        console.log("Login Verified. Token received.");

        // 6. Test GET /me
        console.log("\n--- Testing GET /me ---");
        const meRes = await axios.get(`${API_URL}/me`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log("Identity Verified:", meRes.data.user.email, "| Role:", meRes.data.user.role);

        // 7. Forgot Password
        console.log("\n--- Testing Forgot Password ---");
        const forgotRes = await axios.post(`${API_URL}/forgot-password`, { email: testEmail });
        console.log("Forgot Password Response:", forgotRes.data.message);

        // 8. Reset Password
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
        await User.deleteOne({ email: testEmail });
        await OTP.deleteMany({ email: testEmail });
        console.log("Test data removed.");

        console.log("\nALL TESTS PASSED SUCCESSFULLY! ✅");

    } catch (error) {
        console.error("\nTEST FAILED ❌");
        if (error.response) {
            console.error("Data:", error.response.data);
            console.error("Status:", error.response.status);
        } else {
            console.error(error.message);
        }
    } finally {
        await mongoose.disconnect();
        process.exit();
    }
}

runTests();

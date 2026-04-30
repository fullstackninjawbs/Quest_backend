import axios from 'axios';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import jwt from 'jsonwebtoken';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const API_URL = "http://localhost:5001/api/v1";
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

import Employer from '../src/modules/employer/models/employer.model.js';

async function runTest() {
    try {
        console.log("Connecting to Database...");
        await mongoose.connect(process.env.MONGO_URI);
        
        // 1. Ensure we have a test employer
        const testEmail = "test.employer@quest-test.com";
        let employer = await Employer.findOne({ email: testEmail });
        
        if (!employer) {
            console.log("Creating test employer...");
            employer = await Employer.create({
                first_name: "Test",
                last_name: "Employer",
                email: testEmail,
                password: "Password123!",
                phone: "1234567890",
                company_name: "Test Corp",
                role: "employer",
                isEmailVerified: true,
                status: 'active'
            });
        }

        // 2. Generate Token
        const token = jwt.sign({ id: employer._id }, JWT_SECRET, { expiresIn: '1h' });
        console.log("Generated Token for Employer:", employer.email);

        // 3. Prepare Mock Order Data
        const mockOrder = {
            employee: {
                firstName: "John",
                lastName: "Doe",
                email: "john.doe@example.com",
                phone: "5550199",
                dob: "2000-02-22",
                gender: "M",
                ssnLast4: "TEST123"
            },
            test: {
                testCode: "35105N",
                testName: "SAP 5-50 W/NIT",
                isDOT: false,
                unitCode: "12345",
                accountNumber: "11321272"
            },
            collectionSite: {
                siteId: "",
                name: "Quest Diagnostics - New York Midtown",
                address: "123 Main St, Suite 100, New York, NY 10001",
                phone: "212-555-0199"
            },
            scheduling: {
                mode: "walk_in"
            }
        };

        // 4. Submit Order
        console.log("\n--- Submitting Order to Backend ---");
        try {
            const response = await axios.post(`${API_URL}/orders/submit`, mockOrder, {
                headers: { Authorization: `Bearer ${token}` }
            });

            console.log("✅ ORDER SUBMITTED SUCCESSFULLY");
            console.log("Order ID (Internal):", response.data.data.orderId);
            console.log("Quest Order ID:", response.data.data.questOrderId);
            console.log("Status:", response.data.data.status);
            console.log("Message:", response.data.data.message);

        } catch (error) {
            console.error("❌ ORDER SUBMISSION FAILED");
            if (error.response) {
                console.error("Status:", error.response.status);
                console.error("Data:", JSON.stringify(error.response.data, null, 2));
            } else {
                console.error("Error:", error.message);
                console.log("\nTIP: Make sure your backend server is running on port 5001!");
            }
        }

    } catch (err) {
        console.error("Fatal Error:", err);
    } finally {
        await mongoose.disconnect();
        process.exit();
    }
}

runTest();

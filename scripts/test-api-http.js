import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import axios from "axios";
import jwt from "jsonwebtoken";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

import Employer from "../src/modules/employer/models/employer.model.js";

const testApiHttp = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to DB");

        // Get any employer
        const employer = await Employer.findOne({});
        if (!employer) {
            console.error("No employer found in DB to test with.");
            await mongoose.disconnect();
            return;
        }
        console.log(`Testing with Employer: ${employer.email} (${employer._id})`);

        // Generate token
        const secret = process.env.JWT_SECRET || "ascquest_super_secret_jwt_key_change_in_production";
        const token = jwt.sign({ id: employer._id }, secret, { expiresIn: "1h" });

        // Make HTTP request to local running server
        const port = process.env.PORT || 5001;
        const url = `http://localhost:${port}/api/v1/employer/config/collection-sites?search=07410`;
        console.log(`Sending GET request to ${url}`);

        const response = await axios.get(url, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        console.log("Response Status:", response.status);
        console.log("Response Body (first site):");
        const sites = response.data?.data?.sites;
        if (sites && sites.length > 0) {
            console.log(JSON.stringify(sites[0], null, 2));
        } else {
            console.log("No sites returned. Full response body:", JSON.stringify(response.data, null, 2));
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error("HTTP request failed:", err.message);
        if (err.response) {
            console.error("Response data:", err.response.data);
        }
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }
    }
};

testApiHttp();

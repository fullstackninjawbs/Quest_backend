import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

import SuperAdmin from "../src/modules/superAdmin/models/superAdmin.model.js";
import Employer from "../src/modules/employer/models/employer.model.js";

const checkUser = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to DB");

        const email = "dev.admin@ascquest.com";
        
        const admin = await SuperAdmin.findOne({ email }).select("+password");
        console.log("Admin found:", admin ? "Yes" : "No");
        if (admin) {
            console.log("Admin status:", admin.status);
            console.log("Admin verified:", admin.isEmailVerified);
            console.log("Admin password hashed:", admin.password?.startsWith("$2a$") || admin.password?.startsWith("$2b$"));
        }

        const employer = await Employer.findOne({ email }).select("+password");
        console.log("Employer found:", employer ? "Yes" : "No");

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
};

checkUser();

import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

import SuperAdmin from "../src/modules/superAdmin/models/superAdmin.model.js";

const resetPass = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const email = "dev.admin@ascquest.com";
        const admin = await SuperAdmin.findOne({ email });
        
        if (admin) {
            admin.password = "password123";
            await admin.save();
            console.log("Password reset to 'password123' successfully.");
        } else {
            console.log("Admin not found");
        }
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
};

resetPass();

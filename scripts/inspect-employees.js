import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

import Employee from "../src/modules/employer/models/employee.model.js";

const inspectEmployees = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to DB");

        const employees = await Employee.find({}).limit(10);
        console.log("Sample employees in DB:");
        employees.forEach(emp => {
            console.log(`- Name: ${emp.first_name} ${emp.last_name}, Zip Code: '${emp.zip_code}'`);
        });

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
};

inspectEmployees();

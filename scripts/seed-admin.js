const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const SuperAdmin = require("../src/modules/superAdmin/models/superAdmin.model");

// Load env vars
dotenv.config({ path: path.join(__dirname, "../.env") });

const seedAdmin = async () => {
    try {
        console.log("Connecting to database...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected Successfully.");

        const adminEmail = process.env.SUPER_ADMIN_EMAIL || "admin@ascquest.com";
        const adminPassword = process.env.SUPER_ADMIN_PASSWORD || "AdminPassword123!";

        // Delete existing admin if any
        await SuperAdmin.deleteOne({ email: adminEmail });

        const admin = new SuperAdmin({
            first_name: "Super",
            last_name: "Admin",
            email: adminEmail,
            password: adminPassword,
            phone: "0000000000",
            role: "super_admin",
            status: "active",
            isEmailVerified: true,
        });

        await admin.save();

        console.log("\n" + "=".repeat(30));
        console.log("SUPER ADMIN SEEDED SUCCESSFULLY");
        console.log("=".repeat(30));
        console.log(`Email:    ${adminEmail}`);
        console.log(`Password: ${adminPassword}`);
        console.log("=".repeat(30) + "\n");

        process.exit(0);
    } catch (error) {
        console.error("Error seeding admin:", error.message);
        process.exit(1);
    }
};

seedAdmin();

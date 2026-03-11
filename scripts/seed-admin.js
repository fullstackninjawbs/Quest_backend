const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const User = require("../src/models/user.model");

// Load env vars
dotenv.config({ path: path.join(__dirname, "../.env") });

const seedAdmin = async () => {
    try {
        console.log("Connecting to database...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected Successfully.");

        const adminEmail = "admin@ascquest.com";
        const adminPassword = "AdminPassword123!";

        // Delete existing admin if any
        await User.deleteOne({ email: adminEmail });

        const admin = new User({
            name: "Super Admin",
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

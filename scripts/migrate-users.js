const mongoose = require("mongoose");
require("dotenv").config({ path: require('path').resolve(__dirname, '../.env') });
const SuperAdmin = require("../src/models/superAdmin.model");
const Employer = require("../src/models/employer.model");

// Use MONGO_URI from .env
const MONGO_URI = process.env.MONGO_URI;

async function migrate() {
    if (!MONGO_URI) {
        console.error("❌ MONGO_URI not found in .env file.");
        process.exit(1);
    }

    try {
        console.log("Connecting to Database...");
        await mongoose.connect(MONGO_URI);
        console.log("Connected successfully!");

        const db = mongoose.connection.db;
        
        // 1. Get all users from the old collection
        const users = await db.collection("users").find({}).toArray();

        if (users.length === 0) {
            console.log("No users found in the legacy 'users' collection. Nothing to migrate.");
            process.exit(0);
        }

        console.log(`Found ${users.length} users to migrate. Processing...`);

        for (const user of users) {
            const role = user.role;
            const userData = { ...user };
            
            // Handle legacy 'name' field if first_name/last_name are missing
            if (!userData.first_name && userData.name) {
                const parts = userData.name.trim().split(/\s+/);
                userData.first_name = parts[0] || "User";
                userData.last_name = parts.slice(1).join(" ") || "N/A";
            }

            // Final fallback for required fields
            if (!userData.first_name) userData.first_name = "User";
            if (!userData.last_name) userData.last_name = "N/A";

            // Remove internal _id to let Mongoose create a new one in the new collection
            // or keep it if you want to preserve IDs. Here we let Mongoose handle it.
            delete userData._id;
            
            if (role === "super_admin") {
                const exists = await SuperAdmin.findOne({ email: user.email });
                if (!exists) {
                    await SuperAdmin.create(userData);
                    console.log(`✅ Migrated Super Admin: ${user.email}`);
                } else {
                    console.log(`⏩ Skipping (Already exists): ${user.email}`);
                }
            } else if (role === "employer") {
                const exists = await Employer.findOne({ email: user.email });
                if (!exists) {
                    await Employer.create(userData);
                    console.log(`✅ Migrated Employer: ${user.email}`);
                } else {
                    console.log(`⏩ Skipping (Already exists): ${user.email}`);
                }
            } else {
                console.log(`⚠️ Unknown role '${role}' for: ${user.email}. Skipping.`);
            }
        }

        console.log("\n✨ Migration successful!");
        process.exit(0);
    } catch (err) {
        console.error("❌ Migration failed:", err);
        process.exit(1);
    }
}

migrate();

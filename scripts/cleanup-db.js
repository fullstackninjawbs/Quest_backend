const mongoose = require("mongoose");
require("dotenv").config({ path: require('path').resolve(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI;

async function cleanup() {
    if (!MONGO_URI) {
        console.error("❌ MONGO_URI not found in .env file.");
        process.exit(1);
    }

    try {
        console.log("Connecting to Database for cleanup...");
        await mongoose.connect(MONGO_URI);
        console.log("Connected successfully!");

        const db = mongoose.connection.db;
        
        console.log("⚠️  Attempting to drop the legacy 'users' collection...");
        
        // Check if collection exists first
        const collections = await db.listCollections({ name: "users" }).toArray();
        if (collections.length > 0) {
            await db.collection("users").drop();
            console.log("✅ Successfully dropped 'users' collection!");
        } else {
            console.log("⏩ 'users' collection does not exist. Already cleaned up!");
        }

        console.log("\n✨ Database is now clean and modular!");
        process.exit(0);
    } catch (err) {
        console.error("❌ Cleanup failed:", err);
        process.exit(1);
    }
}

cleanup();

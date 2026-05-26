import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

const checkRawZipKeys = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to DB");

        const db = mongoose.connection.db;
        const collection = db.collection("collectionsites");

        // Fetch some raw documents
        const docs = await collection.find({}).project({ address: 1 }).toArray();
        
        const keyStats = {};
        docs.forEach(doc => {
            if (doc.address) {
                Object.keys(doc.address).forEach(key => {
                    keyStats[key] = (keyStats[key] || 0) + 1;
                });
            }
        });

        console.log("Stats of keys in 'address' subdocument across all sites:");
        console.log(JSON.stringify(keyStats, null, 2));

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
};

checkRawZipKeys();

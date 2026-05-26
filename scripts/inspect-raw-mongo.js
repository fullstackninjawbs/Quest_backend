import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

const inspectRawMongo = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to DB");

        const db = mongoose.connection.db;
        const collection = db.collection("collectionsites");

        const doc = await collection.findOne({ siteCode: { $not: /^QS-/ } });
        console.log("Real Synced Site Raw MongoDB Document:");
        console.log(JSON.stringify(doc, null, 2));

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
};

inspectRawMongo();

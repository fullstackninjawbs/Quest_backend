import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

import CollectionSite from "../src/modules/superAdmin/models/CollectionSite.model.js";

const debugSites = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to DB");

        const totalCount = await CollectionSite.countDocuments();
        console.log("Total collection sites in DB:", totalCount);

        const emptyZipCount = await CollectionSite.countDocuments({ "address.zip": { $in: ["", null, undefined] } });
        console.log("Sites with empty/null/missing zip:", emptyZipCount);

        const sampleSites = await CollectionSite.find({}).limit(5);
        console.log("First 5 sites:");
        sampleSites.forEach(s => {
            console.log(`- SiteCode: ${s.siteCode}, Name: ${s.name}`);
            console.log("  Address:", JSON.stringify(s.address, null, 2));
        });

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
};

debugSites();

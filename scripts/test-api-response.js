import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

import CollectionSite from "../src/modules/superAdmin/models/CollectionSite.model.js";

const testQuery = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to DB");

        const search = "07410";
        const query = {
            $or: [
                { siteCode: { $regex: search, $options: "i" } },
                { name: { $regex: search, $options: "i" } },
                { "address.zip": { $regex: search, $options: "i" } },
                { "address.city": { $regex: search, $options: "i" } }
            ]
        };

        const sites = await CollectionSite.find(query).limit(2);
        console.log("Query Results for search '07410':");
        console.log(JSON.stringify(sites, null, 2));

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
};

testQuery();

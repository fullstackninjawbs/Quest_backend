import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

import CollectionSite from "../src/modules/superAdmin/models/CollectionSite.model.js";

const inspectZips = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to DB");

        const allSites = await CollectionSite.find({}, "siteCode name address.zip address.city address.state").limit(100);
        console.log("Sample of 100 zip codes in DB:");
        const zipMap = {};
        allSites.forEach(s => {
            const zip = s.address?.zip;
            zipMap[zip] = (zipMap[zip] || 0) + 1;
        });
        console.log(JSON.stringify(zipMap, null, 2));

        // Let's check if there are any non-numeric or strange format zips
        const allZips = await CollectionSite.find({}, "address.zip");
        let validZipCount = 0;
        let invalidZipCount = 0;
        const invalidExamples = [];

        allZips.forEach(s => {
            const zip = s.address?.zip;
            // Simple validation: US zip is 5 digits or 5+4 (e.g. 12345 or 12345-6789)
            const isValid = zip && (/^\d{5}$/.test(zip) || /^\d{5}-\d{4}$/.test(zip));
            if (isValid) {
                validZipCount++;
            } else {
                invalidZipCount++;
                if (invalidExamples.length < 20) {
                    invalidExamples.push({ siteCode: s.siteCode, zip });
                }
            }
        });

        console.log(`\nValidation results:`);
        console.log(`Valid 5-digit or 5+4 zip codes: ${validZipCount}`);
        console.log(`Invalid format zip codes: ${invalidZipCount}`);
        console.log("Sample of invalid zip codes:", JSON.stringify(invalidExamples, null, 2));

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
};

inspectZips();

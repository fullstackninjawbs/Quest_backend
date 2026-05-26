import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

import CollectionSite from "../src/modules/superAdmin/models/CollectionSite.model.js";

const inspectZipsDeep = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to DB");

        const allSites = await CollectionSite.find({}, "siteCode name address.zip");
        console.log(`Analyzing ${allSites.length} zip codes...`);

        const stats = {
            empty: 0,
            undefinedOrNull: 0,
            nonString: 0,
            lengthUnder5: 0,
            length5: 0,
            length9NoHyphen: 0,
            length10WithHyphen: 0,
            otherLength: 0,
            hasLeadingSpaces: 0,
            hasTrailingSpaces: 0,
            nonAlphanumeric: 0
        };

        const weirdExamples = [];

        allSites.forEach(s => {
            const zip = s.address?.zip;
            if (zip === undefined || zip === null) {
                stats.undefinedOrNull++;
                return;
            }
            if (typeof zip !== "string") {
                stats.nonString++;
                return;
            }
            if (zip === "") {
                stats.empty++;
                return;
            }

            if (zip.startsWith(" ") || zip.startsWith("\t")) {
                stats.hasLeadingSpaces++;
            }
            if (zip.endsWith(" ") || zip.endsWith("\t")) {
                stats.hasTrailingSpaces++;
            }

            const trimmed = zip.trim();
            if (trimmed.length < 5) {
                stats.lengthUnder5++;
                if (weirdExamples.length < 10) weirdExamples.push({ siteCode: s.siteCode, name: s.name, zip });
            } else if (trimmed.length === 5) {
                stats.length5++;
            } else if (trimmed.length === 9) {
                stats.length9NoHyphen++;
                if (weirdExamples.length < 10) weirdExamples.push({ siteCode: s.siteCode, name: s.name, zip });
            } else if (trimmed.length === 10 && trimmed.includes("-")) {
                stats.length10WithHyphen++;
            } else {
                stats.otherLength++;
                if (weirdExamples.length < 10) weirdExamples.push({ siteCode: s.siteCode, name: s.name, zip });
            }
        });

        console.log("Stats:\n", JSON.stringify(stats, null, 2));
        console.log("Weird Examples:\n", JSON.stringify(weirdExamples, null, 2));

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
};

inspectZipsDeep();

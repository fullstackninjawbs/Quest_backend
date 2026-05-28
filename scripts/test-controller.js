import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

import { getCollectionSites } from "../src/modules/superAdmin/controllers/collectionSite.controller.js";

const testController = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to DB");

        const req = {
            query: {
                page: "1",
                limit: "1",
                search: "07410"
            }
        };

        const res = {
            status: function(code) {
                this.statusCode = code;
                return this;
            },
            json: function(payload) {
                console.log("Controller JSON response status code:", this.statusCode);
                console.log("Controller JSON response payload:");
                console.log(JSON.stringify(payload, null, 2));
            }
        };

        await getCollectionSites(req, res, (err) => {
            console.error("Next middleware called with error:", err);
        });

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
};

testController();

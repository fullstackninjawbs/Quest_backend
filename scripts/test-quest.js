import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

import questOrderService from "../src/services/questOrder.service.js";

async function run() {
  try {
    process.env.QUEST_MOCK_SOAP = "false";

    const testOrderData = {
      labAccount: process.env.QUEST_GLOBAL_LAB_ACCOUNT_NONDOT || "12345678",
      unitCode: "45105N",
      siteCode: "07410",
      dotTest: false,
      reasonForTest: "Pre Employment",
      donor: {
        firstName: "TestFirst",
        lastName: "TestLast",
        phone: "9135551212",
        email: "test@example.com",
        license: "KS1111111"
      }
    };
    
    console.log("Sending Test Order...");
    const result = await questOrderService.createQuestOrder(testOrderData);
    console.log("Done.");
  } catch (err) {
    console.error("Fatal Error:", err);
  }
  process.exit(0);
}
run();

import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from 'url';

// Fix __dirname in ES Modules so dotenv can find the .env file in the parent folder
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

import mongoose from "mongoose";
import Order from "../src/modules/employer/models/order.model.js";
import questOrderService from "../src/services/questOrder.service.js";

async function check() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const order = await Order.findOne({ questOrderId: "QST48245046" });
    if (!order) {
      console.log("Order not found in MongoDB!");
      process.exit(0);
    }
    console.log("✅ Order found in local MongoDB. Quest Order ID:", order.questOrderId);
    console.log("✅ Order Number:", order.order_number);
    
    console.log("\n📡 Pinging Quest Sandbox API for real-time status...");
    const status = await questOrderService.getQuestOrderStatus(order.questOrderId);
    console.log("✅ Response from Quest:", status);
    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}
check();

import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI;

// Quick inline schema definition so we don't have to import the whole model setup
const OrderSchema = new mongoose.Schema({}, { strict: false });
const Order = mongoose.model("Order", OrderSchema, "orders");

async function inspect() {
    if (!MONGO_URI) {
        console.error("❌ MONGO_URI not found in .env file.");
        process.exit(1);
    }

    try {
        console.log("🔗 Connecting to MongoDB Atlas...");
        await mongoose.connect(MONGO_URI);
        console.log("✅ Connected successfully!");

        // Usage: node scripts/inspect-quest-orders.js [limit/all] [filter_id_or_search_term]
        const argsLimit = process.argv[2];
        let argsFilter = process.argv[3];
        
        // If they passed a single argument that is NOT a number and NOT "all", treat it as the search filter
        if (argsLimit && !argsFilter && isNaN(parseInt(argsLimit, 10)) && argsLimit.toLowerCase() !== "all") {
            argsFilter = argsLimit;
        }

        let limitVal = 5;
        if (argsLimit && argsLimit !== argsFilter) {
            if (argsLimit.toLowerCase() === "all") {
                limitVal = 0; // Mongoose 0 means no limit
            } else {
                const parsed = parseInt(argsLimit, 10);
                if (!isNaN(parsed) && parsed > 0) {
                    limitVal = parsed;
                }
            }
        }

        const filterQuery = {};
        if (argsFilter) {
            const filter = argsFilter.trim();
            // Check if it's a 24-character hexadecimal MongoDB ObjectId
            if (filter.match(/^[0-9a-fA-F]{24}$/)) {
                filterQuery.$or = [
                    { _id: new mongoose.Types.ObjectId(filter) },
                    { employee_id: new mongoose.Types.ObjectId(filter) },
                    { employer_id: new mongoose.Types.ObjectId(filter) }
                ];
                console.log(`🎯 Applying filter: MongoDB ID "${filter}"`);
            } else if (filter.toUpperCase().startsWith("QST")) {
                filterQuery.questOrderId = { $regex: filter, $options: "i" };
                console.log(`🎯 Applying filter: Quest Order ID "${filter}"`);
            } else if (filter.includes("@")) {
                filterQuery["employee_snapshot.email"] = { $regex: filter, $options: "i" };
                console.log(`🎯 Applying filter: Candidate Email "${filter}"`);
            } else {
                // Name search (splits full name if space provided)
                const parts = filter.split(/\s+/);
                if (parts.length > 1) {
                    filterQuery.$and = parts.map(part => ({
                        $or: [
                            { "employee_snapshot.first_name": { $regex: part, $options: "i" } },
                            { "employee_snapshot.last_name": { $regex: part, $options: "i" } }
                        ]
                    }));
                } else {
                    filterQuery.$or = [
                        { "employee_snapshot.first_name": { $regex: filter, $options: "i" } },
                        { "employee_snapshot.last_name": { $regex: filter, $options: "i" } }
                    ];
                }
                console.log(`🎯 Applying filter: Candidate Name containing "${filter}"`);
            }
        }

        console.log(`\n🔍 Fetching ${limitVal === 0 ? "ALL" : `the latest ${limitVal}`} matching orders from the database...`);
        const query = Order.find(filterQuery).sort({ createdAt: -1 });
        if (limitVal > 0) {
            query.limit(limitVal);
        }
        const orders = await query;

        if (orders.length === 0) {
            console.log("📭 No orders found in the database.");
            process.exit(0);
        }

        console.log(`\n=============================================================`);
        console.log(`📊 FOUND ${orders.length} LATEST ORDERS FOR QUEST VERIFICATION`);
        console.log(`=============================================================`);

        orders.forEach((order, index) => {
            console.log(`\n[ORDER #${index + 1}]`);
            console.log(`• Internal Order ID: ${order._id}`);
            console.log(`• Order Number:      ${order.order_number || "N/A"}`);
            console.log(`• Candidate:         ${order.employee_snapshot?.first_name} ${order.employee_snapshot?.last_name}`);
            console.log(`• Panel Title:       ${order.test_configuration?.panelTitle} (Unit Code: ${order.test_configuration?.unitCode})`);
            console.log(`• Site Code:         ${order.site_snapshot?.siteCode} (${order.site_snapshot?.name})`);
            console.log(`• Status:            ${order.status.toUpperCase()}`);
            console.log(`• Quest Order ID:    ${order.questOrderId || "❌ Missing Quest Order ID"}`);
            console.log(`• Stripe Payment:    ${order.stripe_payment_id || "❌ Missing Stripe Payment"}`);
            console.log(`• Created At:        ${order.createdAt}`);

            console.log(`\n📡 QUEST INTEGRATION PAYLOAD CHECK:`);
            if (order.request_payload) {
                console.log(`✅ SOAP Request XML: YES (Size: ${order.request_payload.length} bytes)`);
                // Extract SOAP action or first few lines
                const isDOTRequest = order.request_payload.includes("<IsDOT>true</IsDOT>") || order.request_payload.includes("<dotTest>true</dotTest>");
                console.log(`   - Compliance Type: ${isDOTRequest ? "DOT" : "NON-DOT"}`);
            } else {
                console.log(`❌ SOAP Request XML: MISSING`);
            }

            if (order.response_payload) {
                console.log(`✅ SOAP Response XML: YES (Size: ${order.response_payload.length} bytes)`);
                // Extract standard Quest success signals from response XML
                if (order.response_payload.includes("<soap:Envelope")) {
                    console.log(`   - Payload Type: Valid SOAP Envelope`);
                }
                const successMatch = order.response_payload.match(/<Status>([^<]+)<\/Status>/i);
                if (successMatch) {
                    console.log(`   - Quest API Response Status: "${successMatch[1]}"`);
                }
                
                // Let's print a small excerpt of the response payload to verify authenticity
                console.log(`\n   --- QUEST RESPONSE SOAP SNIPPET ---`);
                const responseSnippet = order.response_payload
                    .replace(/[\r\n]+/g, " ")
                    .replace(/\s+/g, " ")
                    .substring(0, 300);
                console.log(`   ${responseSnippet}...`);
                console.log(`   ------------------------------------`);
            } else {
                console.log(`❌ SOAP Response XML: MISSING`);
            }
            console.log(`-------------------------------------------------------------`);
        });

        console.log("\n✨ Verification Complete!");
        process.exit(0);
    } catch (err) {
        console.error("❌ Database query inspection failed:", err);
        process.exit(1);
    }
}

inspect();

import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import axios from "axios";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env variables
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const MONGO_URI = process.env.MONGO_URI;
const PORT = process.env.PORT || 5001;
const CALLBACK_URL = `http://localhost:${PORT}/api/v1/quest/callback`;

// SOAP Envelopes
function getCollectionStatusEnvelope(username, password, refId, questId) {
    return `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <ReceiveCollectionStatus xmlns="http://wssim.labone.com/">
      <username>${username}</username>
      <password>${password}</password>
      <referenceTestId>${refId}</referenceTestId>
      <questOrderId>${questId}</questOrderId>
      <status>COLLECTED</status>
      <collectionDate>${new Date().toISOString()}</collectionDate>
    </ReceiveCollectionStatus>
  </soap:Body>
</soap:Envelope>`;
}

function getLabResultEnvelope(username, password, refId, questId) {
    // Escaped resultXml inside ReceiveLabTestResult
    const resultXmlEscaped = `&lt;?xml version="1.0"?&gt;
&lt;LabTestResult&gt;
  &lt;Status&gt;Completed&lt;/Status&gt;
  &lt;Results&gt;
    &lt;Result&gt;
      &lt;SubstanceName&gt;Amphetamines&lt;/SubstanceName&gt;
      &lt;AlphaResult&gt;Negative&lt;/AlphaResult&gt;
      &lt;QuantitativeResult&gt;0 ng/mL&lt;/QuantitativeResult&gt;
    &lt;/Result&gt;
    &lt;Result&gt;
      &lt;SubstanceName&gt;Cocaine Metabolites&lt;/SubstanceName&gt;
      &lt;AlphaResult&gt;Negative&lt;/AlphaResult&gt;
      &lt;QuantitativeResult&gt;0 ng/mL&lt;/QuantitativeResult&gt;
    &lt;/Result&gt;
    &lt;Result&gt;
      &lt;SubstanceName&gt;Opiates&lt;/SubstanceName&gt;
      &lt;AlphaResult&gt;Negative&lt;/AlphaResult&gt;
      &lt;QuantitativeResult&gt;0 ng/mL&lt;/QuantitativeResult&gt;
    &lt;/Result&gt;
    &lt;Result&gt;
      &lt;SubstanceName&gt;Phencyclidine&lt;/SubstanceName&gt;
      &lt;AlphaResult&gt;Negative&lt;/AlphaResult&gt;
      &lt;QuantitativeResult&gt;0 ng/mL&lt;/QuantitativeResult&gt;
    &lt;/Result&gt;
    &lt;Result&gt;
      &lt;SubstanceName&gt;Marijuana Metabolites&lt;/SubstanceName&gt;
      &lt;AlphaResult&gt;Negative&lt;/AlphaResult&gt;
      &lt;QuantitativeResult&gt;0 ng/mL&lt;/QuantitativeResult&gt;
    &lt;/Result&gt;
  &lt;/Results&gt;
  &lt;ReportBody&gt;
    AMERICAN SCREENING CORPORATION LAB REPORT
    -----------------------------------------
    Specimen: Urine
    Panel: 5-Panel Drug Screen
    Status: Completed / Negative
  &lt;/ReportBody&gt;
  &lt;ResultDocuments&gt;
    &lt;ResultDocument&gt;
      &lt;DocumentType&gt;PDF&lt;/DocumentType&gt;
      &lt;DocumentContent&gt;JVBERi0xLjQKJdOIiokKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCjIgMCBvYmoKPDwKL1R5cGUgL1BhZ2VzCi9LaWRzIFszIDAgUl0KL0NvdW50IDEKPj4KZW5kb2JqCjMgMCBvYmoKPDwKL1R5cGUgL1BhZ2UKL1BhcmVudCAyIDAgUgovTWVkaWFCb3ggWzAgMCA2MTIgNzkyXQovUmVzb3VyY2VzIDw8Ci9Gb250IDw8Ci9GMSA0IDAgUgo+Pgo+PgovQ29udGVudHMgNSAwIFIKPj4KZW5kb2JqCjQgMCBvYmoKPDwKL1R5cGUgL1RmCi9TdWJ0eXBlIC9UeXBlMQovQmFzZUZvbnQgL0hlbHZldGljYQo+PgplbmRvYmoKNSAwIG9iago8PAovTGVuZ3RoIDcwCj4+CnN0cmVhbQpCVAovRjEgMTIgVGYKNTAgNzAwIFRkCihBbWVyaWNhbiBTY3JlZW5pbmcgQ28uIC0gRGVtbyBDRUYgUGRmKSBUagowIC0yMCBUZAooT3JkZXI6IFN1Y2Nlc3NmdWwpIFRoCkVUCmVuZHN0cmVhbQplbmRvYmoKeHJlZgowIDYKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDE1IDAwMDAwIG4gCjAwMDAwMDAwNjAgMDAwMDAgbiAKMDAwMDAwMDExMCAwMDAwMCBmIAowMDAwMDAwMjI1IDAwMDAwIG4gCjAwMDAwMDAyNzUgMDAwMDAgbiAKdHJhaWxlcgo8PAovU2l6ZSA2Ci9Sb290IDEgMCBSPj4Kc3RhcnR4cmVmCjM5OQolJUVPRgo=&lt;/DocumentContent&gt;
    &lt;/ResultDocument&gt;
  &lt;/ResultDocuments&gt;
&lt;/LabTestResult&gt;`;

    return `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <ReceiveLabTestResult xmlns="http://wssim.labone.com/">
      <username>${username}</username>
      <password>${password}</password>
      <referenceTestId>${refId}</referenceTestId>
      <questOrderId>${questId}</questOrderId>
      <resultXml>${resultXmlEscaped}</resultXml>
    </ReceiveLabTestResult>
  </soap:Body>
</soap:Envelope>`;
}

async function test() {
    if (!MONGO_URI) {
        console.error("❌ MONGO_URI not found in .env");
        process.exit(1);
    }

    console.log("🔗 Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    
    // Quick model resolution
    const OrderSchema = new mongoose.Schema({}, { strict: false });
    const Order = mongoose.model("Order", OrderSchema, "orders");

    // 1. Get or seed a test order
    let order = await Order.findOne().sort({ createdAt: -1 });
    if (!order) {
        console.log("🌱 No order found in database. Seeding a mock order for testing...");
        const employerId = new mongoose.Types.ObjectId();
        const employeeId = new mongoose.Types.ObjectId();
        
        order = new Order({
            order_number: `ASC-${Date.now().toString(36).toUpperCase()}`,
            employer_id: employerId,
            employee_id: employeeId,
            questOrderId: "QST999999",
            referenceTestId: "REF999999",
            status: "ordered",
            dot_type: "NON-DOT",
            amount_paid: 4900,
            test_configuration: {
                testType: "Urine Drug Screen",
                reasonForTest: "Pre-Employment",
                collectionType: "Urine",
                panelId: new mongoose.Types.ObjectId(),
                panelTitle: "5-Panel Urine Drug Test",
                unitCode: "A500"
            },
            employee_snapshot: {
                first_name: "Test",
                last_name: "Donor",
                email: "test.donor@example.com",
                phone: "5551234567"
            },
            site_snapshot: {
                siteCode: "PSC-999",
                name: "Mock Collection PSC",
                address: { line1: "123 Main St", city: "Houston", state: "TX", zip: "77002" }
            }
        });
        await order.save();
        console.log(`✅ Seeded mock order with Order Number: ${order.order_number}`);
    } else {
        console.log(`🎯 Found existing order to test: Number=${order.order_number}, Quest ID=${order.questOrderId || "N/A"}`);
    }

    const refId = order.referenceTestId || "REF999999";
    const questId = order.questOrderId || "QST999999";
    const username = process.env.QUEST_CALLBACK_USERNAME || "quest_callback";
    const password = process.env.QUEST_CALLBACK_PASSWORD || "quest_callback_password";

    console.log(`\n🤖 POSTing Collection Status callback to: ${CALLBACK_URL}...`);
    const statusPayload = getCollectionStatusEnvelope(username, password, refId, questId);
    
    try {
        const statusRes = await axios.post(CALLBACK_URL, statusPayload, {
            headers: {
                "Content-Type": "text/xml",
                "SOAPAction": "http://wssim.labone.com/ReceiveCollectionStatus"
            }
        });
        
        console.log("📥 Server Response Code:", statusRes.status);
        console.log("📥 Server Response Payload:\n", statusRes.data);
        
        if (statusRes.data.includes("<ReceiveCollectionStatusResult>0</ReceiveCollectionStatusResult>")) {
            console.log("✅ SOAP status response acknowledged successfully!");
        } else {
            console.warn("⚠️ Unexpected response body returned.");
        }
    } catch (err) {
        console.error("❌ Collection status callback failed:", err.response?.data || err.message);
    }

    // Check DB status update
    let updatedOrder = await Order.findById(order._id);
    console.log(`\n📊 Database verification (After collection): status="${updatedOrder.status}" (Expected: "in-progress")`);

    console.log(`\n🤖 POSTing Lab Results callback to: ${CALLBACK_URL}...`);
    const resultsPayload = getLabResultEnvelope(username, password, refId, questId);
    
    try {
        const resultsRes = await axios.post(CALLBACK_URL, resultsPayload, {
            headers: {
                "Content-Type": "text/xml",
                "SOAPAction": "http://wssim.labone.com/ReceiveLabTestResult"
            }
        });
        
        console.log("📥 Server Response Code:", resultsRes.status);
        console.log("📥 Server Response Payload:\n", resultsRes.data);
        
        if (resultsRes.data.includes("<ReceiveLabTestResultResult>0</ReceiveLabTestResultResult>")) {
            console.log("✅ SOAP results response acknowledged successfully!");
        } else {
            console.warn("⚠️ Unexpected response body returned.");
        }
    } catch (err) {
        console.error("❌ Lab results callback failed:", err.response?.data || err.message);
    }

    // Check DB results update
    updatedOrder = await Order.findById(order._id);
    console.log(`\n📊 Database verification (After results):`);
    console.log(` - Status:        "${updatedOrder.status}" (Expected: "completed")`);
    console.log(` - Test Result:   "${updatedOrder.test_result}" (Expected: "pass")`);
    console.log(` - Substances:    ${JSON.stringify(updatedOrder.substance_results)}`);
    console.log(` - PDF Length:    ${updatedOrder.report_pdf_base64 ? updatedOrder.report_pdf_base64.length : 0} characters`);
    console.log(` - MRO Verified:  ${updatedOrder.mro_verified}`);
    console.log(` - MRO Name:      "${updatedOrder.mro_name}"`);

    await mongoose.disconnect();
    console.log("\n👋 Disconnected. Test complete!");
}

test();

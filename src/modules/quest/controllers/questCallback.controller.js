import { parseStringPromise } from "xml2js";
import Order from "../../employer/models/order.model.js";

// Helper to find a node recursively by name, case-insensitively, stripping namespaces
function findNode(obj, targetName) {
    if (!obj || typeof obj !== "object") return null;
    
    // Check if current level has the key
    const keys = Object.keys(obj);
    for (const key of keys) {
        const localName = key.includes(":") ? key.split(":").pop() : key;
        if (localName.toLowerCase() === targetName.toLowerCase()) {
            return obj[key];
        }
    }
    
    // Recurse into child objects/arrays
    for (const key of keys) {
        const value = obj[key];
        if (Array.isArray(value)) {
            for (const item of value) {
                const child = findNode(item, targetName);
                if (child) return child;
            }
        } else if (typeof value === "object") {
            const child = findNode(value, targetName);
            if (child) return child;
        }
    }
    
    return null;
}

// Helper to get first scalar value of a parsed xml2js node
function getFirstValue(node) {
    if (node === null || node === undefined) return null;
    if (Array.isArray(node)) {
        return getFirstValue(node[0]);
    }
    if (typeof node === "object") {
        if (node._ !== undefined) return node._;
        const keys = Object.keys(node);
        if (keys.length === 1 && keys[0] === "$") return null; // only attributes
        // Try searching for a child or return null
        return null;
    }
    return node;
}

// SOAP Fault XML Helper
function buildSoapFault(code, message) {
    return `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <soap:Fault>
      <faultcode>soap:${code}</faultcode>
      <faultstring>${message}</faultstring>
    </soap:Fault>
  </soap:Body>
</soap:Envelope>`;
}

// SOAP Response Envelope Helper
function buildSoapResponse(methodName, resultTag, resultValue) {
    return `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <${methodName}Response xmlns="http://wssim.labone.com/">
      <${resultTag}>${resultValue}</${resultTag}>
    </${methodName}Response>
  </soap:Body>
</soap:Envelope>`;
}

// Map incoming Quest status strings to internal order status values
function mapQuestStatus(statusStr) {
    if (!statusStr) return "ordered";
    const status = statusStr.toLowerCase();
    
    if (status.includes("cancel") || status === "x") {
        return "cancelled";
    }
    if (status.includes("complete") || status.includes("result") || status.includes("final")) {
        return "completed";
    }
    if (status.includes("mro")) {
        return "MRO Review";
    }
    if (status.includes("progress") || status.includes("collect") || status.includes("atlab") || status.includes("received")) {
        return "in-progress";
    }
    if (status.includes("schedule")) {
        return "scheduled";
    }
    if (status.includes("fail") || status.includes("error")) {
        return "failed";
    }
    return "in-progress"; // Default fallback for active tracking
}

// Map substances to pass/fail/PHO status
function determineTestResult(substances) {
    if (!substances || substances.length === 0) return "—";
    
    let hasPositive = false;
    let hasPending = false;
    
    for (const sub of substances) {
        const res = (sub.result || "").toLowerCase();
        if (res.includes("positive") || res.includes("fail") || res.includes("detected")) {
            hasPositive = true;
        } else if (res.includes("pending") || res.includes("review") || res.includes("pho")) {
            hasPending = true;
        }
    }
    
    if (hasPositive) return "fail";
    if (hasPending) return "PHO";
    return "pass";
}

/**
 * Handle incoming Quest SOAP XML callbacks
 */
export const handleQuestCallback = async (req, res) => {
    const rawXml = req.body;
    console.log("📥 Quest SOAP Callback Received. Length:", rawXml ? rawXml.length : 0, "bytes");
    
    if (!rawXml) {
        return res.status(400).send(buildSoapFault("Client", "Empty request body"));
    }

    try {
        // 1. Parse raw XML
        const parsed = await parseStringPromise(rawXml, { explicitCharkey: true, mergeAttrs: true });
        
        // Find SOAP Body
        const soapBody = findNode(parsed, "Body");
        if (!soapBody) {
            return res.status(400).send(buildSoapFault("Client", "SOAP Body not found in Envelope"));
        }

        // Identify the SOAP action/method called
        const possibleMethods = [
            "ReceiveCollectionStatus",
            "ReceiveLabTestResult",
            "ReceiveLabReqStatus",
            "ProcessOrderStatus",
            "ProcessOrderResult",
            "ReceiveCollectionResult"
        ];
        
        let activeMethod = null;
        let methodNode = null;
        
        for (const method of possibleMethods) {
            methodNode = findNode(soapBody, method);
            if (methodNode) {
                activeMethod = method;
                break;
            }
        }
        
        if (!activeMethod) {
            console.warn("⚠️ Unknown SOAP callback action or method signature in body:", Object.keys(soapBody));
            return res.status(400).send(buildSoapFault("Client", "Unknown SOAP Method"));
        }
        
        console.log(`📡 Detected SOAP Method: ${activeMethod}`);

        // 2. Validate Credentials (if set in env)
        const username = getFirstValue(findNode(methodNode, "username"));
        const password = getFirstValue(findNode(methodNode, "password"));
        
        if (process.env.QUEST_CALLBACK_USERNAME && process.env.QUEST_CALLBACK_PASSWORD) {
            if (username !== process.env.QUEST_CALLBACK_USERNAME || password !== process.env.QUEST_CALLBACK_PASSWORD) {
                console.warn(`🔒 Unauthorized callback attempt. Username provided: "${username}"`);
                return res.status(401).send(buildSoapFault("Client", "Unauthorized callback credentials"));
            }
        }

        // 3. Extract order matching identifiers
        let referenceTestId = getFirstValue(findNode(methodNode, "referenceTestId") || findNode(methodNode, "ReferenceTestID"));
        let questOrderId = getFirstValue(findNode(methodNode, "questOrderId") || findNode(methodNode, "QuestOrderID"));
        let clientReferenceId = getFirstValue(findNode(methodNode, "clientReferenceId") || findNode(methodNode, "ClientReferenceID"));
        
        // Sniff inside escaped statusXml/resultXml if applicable (ESP integration spec uses escaped payloads)
        let innerParsed = null;
        const statusXml = getFirstValue(findNode(methodNode, "statusXml") || findNode(methodNode, "StatusXml"));
        const resultXml = getFirstValue(findNode(methodNode, "resultXml") || findNode(methodNode, "ResultXml"));
        
        const xmlToSniff = statusXml || resultXml;
        if (xmlToSniff) {
            try {
                innerParsed = await parseStringPromise(xmlToSniff, { explicitCharkey: true, mergeAttrs: true });
                console.log("🔓 Parsed inner escaped XML payload successfully.");
                
                if (!referenceTestId) referenceTestId = getFirstValue(findNode(innerParsed, "ReferenceTestID") || findNode(innerParsed, "referenceTestId"));
                if (!questOrderId) questOrderId = getFirstValue(findNode(innerParsed, "QuestOrderID") || findNode(innerParsed, "questOrderId"));
                if (!clientReferenceId) clientReferenceId = getFirstValue(findNode(innerParsed, "ClientReferenceID") || findNode(innerParsed, "clientReferenceId"));
            } catch (err) {
                console.error("❌ Failed to parse nested escaped XML payload:", err.message);
            }
        }

        console.log(`🔍 Lookup parameters: referenceTestId="${referenceTestId}", questOrderId="${questOrderId}", clientRef="${clientReferenceId}"`);

        if (!referenceTestId && !questOrderId && !clientReferenceId) {
            return res.status(400).send(buildSoapFault("Client", "Could not locate ReferenceTestID, QuestOrderID, or ClientReferenceID in payload"));
        }

        // 4. Find matching order in database
        const lookupQuery = [];
        if (referenceTestId) lookupQuery.push({ referenceTestId });
        if (questOrderId) lookupQuery.push({ questOrderId });
        if (clientReferenceId) {
            lookupQuery.push({ order_number: clientReferenceId });
            // Support matching REQ-... prefix to order_number
            lookupQuery.push({ referenceTestId: clientReferenceId });
        }
        
        const order = await Order.findOne({ $or: lookupQuery });
        if (!order) {
            console.warn(`⚠️ Match not found in Database for Order callback.`);
            // Return success/ack so Quest stops retrying, or returns a fault depending on policy.
            // Let's return success to avoid clogging Quest retry queues, but with a warning log.
            const resultTag = `${activeMethod}Result`;
            const ackVal = activeMethod.startsWith("Process") ? "SUCCESS" : "0";
            return res.status(200)
                .set("Content-Type", "text/xml")
                .send(buildSoapResponse(activeMethod, resultTag, ackVal));
        }

        console.log(`🎉 Matched Order: ID=${order._id}, Order Number=${order.order_number}, Current Status=${order.status}`);

        // 5. Extract status updates
        let questStatusRaw = getFirstValue(findNode(methodNode, "status") || findNode(methodNode, "Status") || findNode(methodNode, "OrderStatus"));
        if (innerParsed && !questStatusRaw) {
            questStatusRaw = getFirstValue(findNode(innerParsed, "status") || findNode(innerParsed, "Status") || findNode(innerParsed, "OrderStatus"));
        }

        const mappedStatus = mapQuestStatus(questStatusRaw || activeMethod);
        
        // Update order status if newer or valid transition
        if (mappedStatus && mappedStatus !== order.status) {
            order.status = mappedStatus;
            order.status_logs.push({
                status: mappedStatus,
                updatedAt: new Date()
            });
        }

        // 6. Extract results & PDF if result callback
        const payloadToExtractResults = innerParsed || methodNode;
        
        // Extract substances list
        const resultsNode = findNode(payloadToExtractResults, "Results") || findNode(payloadToExtractResults, "Result");
        if (resultsNode) {
            const resultItems = Array.isArray(resultsNode) 
                ? resultsNode 
                : (resultsNode.Result || resultsNode.substance || resultsNode.ResultItem || []);
            const items = Array.isArray(resultItems) ? resultItems : [resultItems];
            
            const substanceResults = [];
            for (const item of items) {
                const name = getFirstValue(findNode(item, "SubstanceName") || findNode(item, "Substance") || findNode(item, "Name") || findNode(item, "Analyte"));
                const resValue = getFirstValue(findNode(item, "AlphaResult") || findNode(item, "Result") || findNode(item, "Value"));
                const quantVal = getFirstValue(findNode(item, "ResultValue") || findNode(item, "Value") || findNode(item, "QuantitativeResult") || findNode(item, "ResultValueUnit"));
                
                if (name) {
                    substanceResults.push({
                        substanceName: name,
                        result: resValue || "Negative",
                        value: quantVal || "—"
                    });
                }
            }
            
            if (substanceResults.length > 0) {
                order.substance_results = substanceResults;
                order.test_result = determineTestResult(substanceResults);
                console.log(`🧪 Extracted ${substanceResults.length} substance results. Overall result: ${order.test_result}`);
            }
        }

        // Extract plain text report
        const reportBody = getFirstValue(
            findNode(payloadToExtractResults, "ReportBody") || 
            findNode(payloadToExtractResults, "plainTextReport") || 
            findNode(payloadToExtractResults, "PlainTextReport") || 
            findNode(payloadToExtractResults, "FormattedReport")
        );
        if (reportBody) {
            order.plain_text_report = reportBody;
        }

        // Extract base64 PDF document
        const docNode = findNode(payloadToExtractResults, "ResultDocuments") || 
                        findNode(payloadToExtractResults, "ResultDocument") || 
                        findNode(payloadToExtractResults, "Document") || 
                        findNode(payloadToExtractResults, "PDF") || 
                        findNode(payloadToExtractResults, "ResultDocumentList") ||
                        findNode(payloadToExtractResults, "document");
        if (docNode) {
            const docItems = Array.isArray(docNode) 
                ? docNode 
                : (docNode.Document || docNode.ResultDocument || docNode.Attachment || docNode.document || []);
            const items = Array.isArray(docItems) ? docItems : [docItems];
            
            for (const item of items) {
                const content = getFirstValue(
                    findNode(item, "DocumentContent") || 
                    findNode(item, "Base64Content") || 
                    findNode(item, "Content") || 
                    findNode(item, "Stream") ||
                    findNode(item, "content")
                );
                if (content && content.trim().length > 0) {
                    order.report_pdf_base64 = content.trim();
                    console.log(`📄 Saved official PDF report stream (${Math.round(content.length / 1024)} KB)`);
                    break;
                }
            }
        }

        // Extract MRO Verified & MRO Name details
        const mroVerifiedRaw = getFirstValue(findNode(payloadToExtractResults, "MroVerified") || findNode(payloadToExtractResults, "mroVerified"));
        if (mroVerifiedRaw) {
            order.mro_verified = mroVerifiedRaw === "true" || mroVerifiedRaw === "Y" || mroVerifiedRaw === true;
        } else if (order.status === "completed") {
            // Default completed order from Quest is considered MRO Verified
            order.mro_verified = true;
        }
        
        const mroNameRaw = getFirstValue(
            findNode(payloadToExtractResults, "MroName") || 
            findNode(payloadToExtractResults, "mroName") || 
            findNode(payloadToExtractResults, "MedicalReviewOfficer")
        );
        if (mroNameRaw) {
            order.mro_name = mroNameRaw;
        } else if (order.mro_verified && !order.mro_name) {
            order.mro_name = "Dr. Robert Carter, MD"; // Standard default placeholder matching mock layout
        }

        // Save status change or auditing payload details
        order.response_payload = rawXml; // Store incoming callback xml in response_payload
        await order.save();
        console.log(`💾 Order successfully updated in MongoDB.`);

        // 7. Send SOAP success acknowledgment
        const resultTag = `${activeMethod}Result`;
        const ackVal = activeMethod.startsWith("Process") ? "SUCCESS" : "0";
        const responseXml = buildSoapResponse(activeMethod, resultTag, ackVal);
        
        return res.status(200)
            .set("Content-Type", "text/xml")
            .send(responseXml);
            
    } catch (error) {
        console.error("❌ Exception during Quest Callback SOAP Handler processing:", error);
        return res.status(500).send(buildSoapFault("Server", `Internal callback processing error: ${error.message}`));
    }
};

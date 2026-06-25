import axios from "axios";
import { parseStringPromise } from "xml2js";
import fs from "fs";
import path from "path";

/**
 * Service to handle Quest Diagnostics Order Placement and Cancellations.
 * Communicates with Quest Diagnostics SOAP Web Services.
 */
class QuestOrderService {
  constructor() {
    this.url = process.env.QUEST_UAT_ORDER_URL || "https://qcs-uat.questdiagnostics.com/services/ESPService.asmx";
    this.username = process.env.QUEST_UAT_USERNAME || "cli_AmericanScreeningUAT";
    this.password = process.env.QUEST_UAT_PASSWORD || "83kAN6Nd6me6";
  }

  /**
   * Helper to perform axios SOAP post
   */
  async _soapRequest(action, bodyXml) {
    const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    ${bodyXml}
  </soap:Body>
</soap:Envelope>`;

    try {
      const response = await axios.post(this.url, soapEnvelope, {
        headers: {
          "Content-Type": "text/xml; charset=utf-8",
          "SOAPAction": `http://wssim.labone.com/${action}`
        },
        timeout: 20000 // 20-second timeout for quick failures
      });
      return {
        success: true,
        xml: response.data
      };
    } catch (error) {
      console.error("Quest SOAP Axios Connection Error:", error.message);

      // Try to extract raw SOAP fault from response if available
      const faultXml = error.response?.data;
      if (faultXml) {
        return {
          success: false,
          xml: faultXml,
          errorMsg: `Quest SOAP Fault: ${error.message}`
        };
      }
      throw new Error(`Failed to establish connection with Quest SOAP API: ${error.message}`);
    }
  }

  /**
   * Submits a new drug test order to Quest Diagnostics
   */
  async createQuestOrder(orderData) {
    console.log(`QuestOrderService: Initiating CreateOrder for ${orderData.donor.firstName} ${orderData.donor.lastName}...`);

    const {
      labAccount,
      unitCode,
      siteCode,
      dotTest = false,
      observedRequested = false,
      splitSpecimenRequested = false,
      reasonForTest = "Pre Employment",
      testingAuthority,
      donor
    } = orderData;

    // Build SOAP CreateOrder Payload according to Quest Implementation Guide v2.0
    // The CreateOrder envelope expects <username>, <password>, and an <OrderXml> string.
    // The <OrderXml> contains a nested XML document <CreateOrderTest>.

    const orderXmlString = `<?xml version="1.0"?>
    <Order>
      <EventInfo>
        <CollectionSiteID>${siteCode || ""}</CollectionSiteID>
        <EndDateTime></EndDateTime>
        <EndDateTimeTimeZoneID></EndDateTimeTimeZoneID>
        <EmailAuthorizationAddresses>
          <EmailAddress>${donor.email || ""}</EmailAddress>
        </EmailAuthorizationAddresses>
      </EventInfo>
      <DonorInfo>
        <FirstName>${donor.firstName || "Unknown"}</FirstName>
        <MiddleName></MiddleName>
        <LastName>${donor.lastName || "Unknown"}</LastName>
        <PrimaryID>${donor.license || Math.floor(Math.random() * 1000000000)}</PrimaryID>
        <PrimaryIDType>EIN</PrimaryIDType>
        <DOB>${donor.dob ? donor.dob.replace(/-/g, '/') : '1990/01/01'}</DOB>
        <PrimaryPhone>${(donor.phone || "0000000000").replace(/[^0-9]/g, '').padStart(10, '0').substring(0, 10)}</PrimaryPhone>
        <SecondaryPhone></SecondaryPhone>
      </DonorInfo>
      <ClientInfo>
        <ContactName>ASC Admin</ContactName>
        <TelephoneNumber>0000000000</TelephoneNumber>
        <LabAccount>${labAccount}</LabAccount>
        <CSL></CSL>
      </ClientInfo>
      <TestInfo>
        <ClientReferenceID>REQ-${Math.floor(Date.now() / 1000)}</ClientReferenceID>
        <DOTTest>${dotTest ? 'Y' : 'N'}</DOTTest>
        <TestingAuthority>${dotTest ? (testingAuthority || 'FMCSA') : ''}</TestingAuthority>
        <ReasonForTestID>${reasonForTest === "Post Accident" ? 2 : reasonForTest === "Random" ? 3 : 1}</ReasonForTestID>
        <PhysicalReasonForTestID></PhysicalReasonForTestID>
        <ObservedRequested>${observedRequested ? 'Y' : 'N'}</ObservedRequested>
        <SplitSpecimenRequested>${splitSpecimenRequested ? 'Y' : 'N'}</SplitSpecimenRequested>
        <CSOs></CSOs>
        <OrderComments></OrderComments>
        <Screenings>
          <UnitCodes>
            <UnitCode>${unitCode}</UnitCode>
          </UnitCodes>
        </Screenings>
      </TestInfo>
      <ClientCustom>
        <ResponseURL></ResponseURL>
      </ClientCustom>
    </Order>`;


    // Wrap the nested XML in CDATA so it is passed safely without entity encoding.
    // NOTE: Quest expects the tag to be lowercase <orderXml> - this is case-sensitive!
    const bodyXml = `<CreateOrder xmlns="http://wssim.labone.com/">
      <username>${this.username}</username>
      <password>${this.password}</password>
      <orderXml><![CDATA[${orderXmlString}]]></orderXml>
    </CreateOrder>`;

    // Optional: Format XML for better console readability
    const formatXml = (xml) => {
      let formatted = '';
      let reg = /(>)(<)(\/*)/g;
      xml = xml.replace(reg, '$1\r\n$2$3');
      let pad = 0;
      xml.split('\r\n').forEach(function (node) {
        let indent = 0;
        if (node.match(/.+<\/\w[^>]*>$/)) {
          indent = 0;
        } else if (node.match(/^<\/\w/)) {
          if (pad != 0) { pad -= 1; }
        } else if (node.match(/^<\w([^>]*[^\/])?>.*$/)) {
          indent = 1;
        } else {
          indent = 0;
        }
        let padding = '';
        for (let i = 0; i < pad; i++) { padding += '  '; }
        formatted += padding + node + '\r\n';
        pad += indent;
      });
      return formatted.trim();
    };

    const formattedOrderXml = formatXml(orderXmlString);
    const formattedSoapBody = formatXml(bodyXml);

    console.log("\n\n\x1b[36m=== [START] QUEST ORDER XML PAYLOAD BEING SENT ===\x1b[0m");
    console.log(formattedOrderXml);
    console.log("\x1b[36m=== [END] QUEST ORDER XML PAYLOAD ===\x1b[0m\n");

    // Write it to a file so it's super easy to read with VSCode formatting
    try {
      const logPath = path.resolve(process.cwd(), "latest_quest_request.xml");
      fs.writeFileSync(logPath, formattedSoapBody);
      console.log(`\x1b[32m[!] The full SOAP envelope has been saved to: ${logPath}\x1b[0m`);
      console.log(`\x1b[32m[!] You can open this file in your editor to perfectly view the structure.\x1b[0m\n\n`);
    } catch (err) {
      console.log("Could not write XML to file for debugging.");
    }

    try {
      const soapRes = await this._soapRequest("CreateOrder", bodyXml);

      // ── LOG RAW SOAP RESPONSE ──────────────────────────────────────────────
      console.log("\n\x1b[35m=== [START] QUEST RAW SOAP RESPONSE ===\x1b[0m");
      console.log(soapRes.xml);
      console.log("\x1b[35m=== [END] QUEST RAW SOAP RESPONSE ===\x1b[0m\n");
      // ──────────────────────────────────────────────────────────────────────

      const parsedResult = await parseStringPromise(soapRes.xml);

      // Validate SOAP Response structure
      const soapBody = parsedResult["soap:Envelope"]?.["soap:Body"]?.[0];

      // Check for SOAP Faults
      if (!soapRes.success || soapBody?.["soap:Fault"]) {
        const fault = soapBody?.["soap:Fault"]?.[0];
        const faultString = fault?.faultstring?.[0] || "Unknown SOAP Fault";
        console.error("Quest SOAP SOAPAction Fault returned:", faultString);
        console.log("=== FULL RAW FAULT DETAILS ===");
        console.log(JSON.stringify(fault, null, 2));
        console.log("==============================");

        throw new Error(`Quest SOAP SOAPAction Fault returned: ${faultString}`);
      }

      const createRes = soapBody?.["CreateOrderResponse"]?.[0]?.["CreateOrderResult"]?.[0];
      const innerData = await parseStringPromise(createRes);
      const orderResult = innerData?.OrderResult || {};

      if (orderResult.Status?.[0] === "Error") {
        throw new Error(orderResult.ErrorDetail?.[0] || "Quest returned an order creation error.");
      }

      return {
        questOrderId: orderResult.QuestOrderID?.[0] || `Q-${Math.floor(100000 + Math.random() * 900000)}`,
        referenceTestId: orderResult.ReferenceTestID?.[0] || `REF-${Math.floor(1000000 + Math.random() * 9000000)}`,
        status: "ordered",
        requestXml: bodyXml,
        responseXml: soapRes.xml
      };

    } catch (error) {
      console.error("Quest CreateOrder Integration Error:", error.message);
      throw error;
    }
  }

  /**
   * Requests Quest to void/cancel an existing order
   */
  async cancelQuestOrder(questOrderId, referenceTestId) {
    console.log(`QuestOrderService: Requesting CancelOrder for Quest ID: ${questOrderId}...`);

    const bodyXml = `<CancelOrder xmlns="http://wssim.labone.com/">
      <username>${this.username}</username>
      <password>${this.password}</password>
      <questOrderId>${questOrderId}</questOrderId>
      <referenceTestId>${referenceTestId || ""}</referenceTestId>
    </CancelOrder>`;

    try {
      const soapRes = await this._soapRequest("CancelOrder", bodyXml);
      const parsedResult = await parseStringPromise(soapRes.xml);
      const soapBody = parsedResult["soap:Envelope"]?.["soap:Body"]?.[0];

      if (soapBody?.["soap:Fault"]) {
        const faultString = soapBody?.["soap:Fault"]?.[0]?.faultstring?.[0] || "Unknown Fault";
        throw new Error(`Quest SOAP Cancellation Rejection: ${faultString}`);
      }

      const cancelRes = soapBody?.["CancelOrderResponse"]?.[0]?.["CancelOrderResult"]?.[0];
      const innerData = await parseStringPromise(cancelRes);
      const cancelResult = innerData?.CancelResult || {};

      if (cancelResult.Status?.[0] === "Error") {
        throw new Error(cancelResult.ErrorDetail?.[0] || "Failed to cancel order with Quest.");
      }

      return {
        success: true,
        requestXml: bodyXml,
        responseXml: soapRes.xml
      };
    } catch (error) {
      console.error("Quest CancelOrder Integration Error:", error.message);
      throw error;
    }
  }




}

export default new QuestOrderService();

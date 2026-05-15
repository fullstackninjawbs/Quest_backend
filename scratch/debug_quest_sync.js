import dotenv from 'dotenv';
dotenv.config();
import questService from '../src/services/quest.service.js';
import { parseStringPromise } from 'xml2js';

async function testSync() {
    try {
        console.log("Testing Quest Sync with credentials...");
        questService.username = process.env.QUEST_UAT_USERNAME;
        questService.password = process.env.QUEST_UAT_PASSWORD;
        questService.url = process.env.QUEST_UAT_ES_URL;

        const bodyXml = `<FullRetrieveCollectionSiteDetails xmlns="http://wssim.labone.com/">
      <username>${questService.username}</username>
      <password>${questService.password}</password>
    </FullRetrieveCollectionSiteDetails>`;

        const xmlResponse = await questService._soapRequest('FullRetrieveCollectionSiteDetails', bodyXml);
        console.log("Raw SOAP response length:", xmlResponse.length);
        
        const result = await parseStringPromise(xmlResponse);
        const innerXml = result['soap:Envelope']['soap:Body'][0]['FullRetrieveCollectionSiteDetailsResponse'][0]['FullRetrieveCollectionSiteDetailsResult'][0];
        
        console.log("Inner XML start:", innerXml.substring(0, 500));
        
        const data = await parseStringPromise(innerXml);
        console.log("Keys in parsed data:", Object.keys(data));
        if (Object.keys(data).length > 0) {
            const rootKey = Object.keys(data)[0];
            console.log(`Root key '${rootKey}' content keys:`, Object.keys(data[rootKey]));
        }

    } catch (error) {
        console.error("Test Failed:", error.message);
    }
}

testSync();

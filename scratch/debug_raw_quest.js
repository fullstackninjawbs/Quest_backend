import dotenv from 'dotenv';
dotenv.config();
import questService from '../src/services/quest.service.js';
import { parseStringPromise } from 'xml2js';

async function testIncremental() {
    try {
        console.log("Testing Quest Incremental Sync...");
        questService.username = process.env.QUEST_UAT_USERNAME;
        questService.password = process.env.QUEST_UAT_PASSWORD;
        questService.url = process.env.QUEST_UAT_ES_URL;

        const date = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
        const dateStr = date.toISOString();
        console.log("Fetching from date:", dateStr);

        const bodyXml = `<UpdateRetrieveCollectionSiteDetails xmlns="http://wssim.labone.com/">
      <username>${questService.username}</username>
      <password>${questService.password}</password>
      <fromDate>${dateStr}</fromDate>
    </UpdateRetrieveCollectionSiteDetails>`;

        const xmlResponse = await questService._soapRequest('UpdateRetrieveCollectionSiteDetails', bodyXml);
        const result = await parseStringPromise(xmlResponse);
        const innerXml = result['soap:Envelope']['soap:Body'][0]['UpdateRetrieveCollectionSiteDetailsResponse'][0]['UpdateRetrieveCollectionSiteDetailsResult'][0];
        const data = await parseStringPromise(innerXml);
        const sitesRaw = data.CollectionSiteDetails?.CollectionSiteDetail || [];

        console.log("SUCCESS! Got raw sites count:", sitesRaw.length);
        if (sitesRaw.length > 0) {
            console.log("First raw site object:\n", JSON.stringify(sitesRaw[0], null, 2));
        } else {
            console.log("No updated sites found in the last 30 days.");
            // If no sites updated in last 30 days, let's try a different approach or fetch a single site if possible, 
            // or let's try to query with a much older date (e.g. 1 year ago)
        }
    } catch (error) {
        console.error("Incremental Test Failed:", error.message);
    }
}

testIncremental();

import dotenv from 'dotenv';
dotenv.config();
import questService from '../src/services/quest.service.js';
import { parseStringPromise } from 'xml2js';

async function inspectSingleEntry() {
    try {
        console.log("Fetching one entry from Quest UAT for inspection...");
        questService.username = process.env.QUEST_UAT_USERNAME;
        questService.password = process.env.QUEST_UAT_PASSWORD;
        questService.url = process.env.QUEST_UAT_ES_URL;

        const bodyXml = `<FullRetrieveCollectionSiteDetails xmlns="http://wssim.labone.com/">
      <username>${questService.username}</username>
      <password>${questService.password}</password>
    </FullRetrieveCollectionSiteDetails>`;

        const xmlResponse = await questService._soapRequest('FullRetrieveCollectionSiteDetails', bodyXml);
        const result = await parseStringPromise(xmlResponse);
        const innerXml = result['soap:Envelope']['soap:Body'][0]['FullRetrieveCollectionSiteDetailsResponse'][0]['FullRetrieveCollectionSiteDetailsResult'][0];
        
        const data = await parseStringPromise(innerXml);
        const sitesRaw = data.CollectionSiteDetails?.CollectionSiteDetail || [];
        
        if (sitesRaw.length > 0) {
            console.log("\n--- FULL RAW PARSED DATA FOR ONE ENTRY ---");
            // Print the second one just in case the first is a 'Mirrored Site'
            const sample = sitesRaw[1] || sitesRaw[0];
            console.log(JSON.stringify(sample, null, 2));
            console.log("\n--- END OF ENTRY ---");
        } else {
            console.log("No sites found.");
        }

    } catch (error) {
        console.error("Inspection Failed:", error.message);
    }
}

inspectSingleEntry();

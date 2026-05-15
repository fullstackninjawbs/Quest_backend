import dotenv from 'dotenv';
dotenv.config();
import questService from '../src/services/quest.service.js';
import { parseStringPromise } from 'xml2js';

async function findCoordinates() {
    try {
        console.log("Searching for coordinates in Quest data...");
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
            const firstSite = sitesRaw[0];
            const allKeys = Object.keys(firstSite);
            const coordKeys = allKeys.filter(k => k.toLowerCase().includes('lat') || k.toLowerCase().includes('long') || k.toLowerCase().includes('coord'));
            
            console.log("\nPossible Coordinate Keys found:", coordKeys);
            if (coordKeys.length > 0) {
                coordKeys.forEach(k => console.log(`${k}:`, firstSite[k]));
            } else {
                console.log("No Latitude/Longitude keys found in the top-level site object.");
                // Check inside Address
                const addrKeys = Object.keys(firstSite.Address?.[0] || {});
                const addrCoordKeys = addrKeys.filter(k => k.toLowerCase().includes('lat') || k.toLowerCase().includes('long'));
                console.log("Possible Coordinate Keys inside Address:", addrCoordKeys);
            }
        }
    } catch (error) {
        console.error("Search Failed:", error.message);
    }
}

findCoordinates();

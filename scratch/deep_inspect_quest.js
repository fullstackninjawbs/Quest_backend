import dotenv from 'dotenv';
dotenv.config();
import questService from '../src/services/quest.service.js';
import { parseStringPromise } from 'xml2js';
import util from 'util';

async function deepInspectEntry() {
    try {
        console.log("Starting Deep Inspection of Quest Collection Site Data...");
        questService.username = process.env.QUEST_UAT_USERNAME;
        questService.password = process.env.QUEST_UAT_PASSWORD;
        questService.url = process.env.QUEST_UAT_ES_URL;

        const bodyXml = `<FullRetrieveCollectionSiteDetails xmlns="http://wssim.labone.com/">
      <username>${questService.username}</username>
      <password>${questService.password}</password>
    </FullRetrieveCollectionSiteDetails>`;

        const xmlResponse = await questService._soapRequest('FullRetrieveCollectionSiteDetails', bodyXml);
        console.log("Download Complete (77MB XML). Parsing...");
        
        const result = await parseStringPromise(xmlResponse);
        const innerXml = result['soap:Envelope']['soap:Body'][0]['FullRetrieveCollectionSiteDetailsResponse'][0]['FullRetrieveCollectionSiteDetailsResult'][0];
        
        const data = await parseStringPromise(innerXml);
        const sitesRaw = data.CollectionSiteDetails?.CollectionSiteDetail || [];
        
        // Find a site that is likely a "Real" one (not a mirrored site)
        // Usually real sites have a more complete address and services
        const realSite = sitesRaw.find(s => s.Address?.[0]?.Name?.[0] && !s.Address[0].Name[0].includes("Mirrored")) || sitesRaw[0];
        
        if (realSite) {
            console.log("\n================================================================================");
            console.log("            QUEST COLLECTION SITE: FULL RAW DATA (EVERY DETAIL)                 ");
            console.log("================================================================================\n");
            
            // util.inspect with depth null ensures we see nested objects like Services and Remittance addresses
            console.log(util.inspect(realSite, { showHidden: false, depth: null, colors: true }));
            
            console.log("\n================================================================================");
            console.log(`Site Code: ${realSite.SiteCode?.[0]}`);
            console.log(`Total Keys Available for this site: ${Object.keys(realSite).length}`);
            console.log("================================================================================\n");
        } else {
            console.log("No sites found to inspect.");
        }

    } catch (error) {
        console.error("Deep Inspection Failed:", error.message);
    }
}

deepInspectEntry();

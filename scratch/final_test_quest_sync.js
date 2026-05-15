import dotenv from 'dotenv';
dotenv.config();
import questService from '../src/services/quest.service.js';

async function testSync() {
    try {
        console.log("Testing Quest Sync with credentials...");
        questService.username = process.env.QUEST_UAT_USERNAME;
        questService.password = process.env.QUEST_UAT_PASSWORD;
        questService.url = process.env.QUEST_UAT_ES_URL;

        const sites = await questService.fetchAllCollectionSites();
        console.log("SUCCESS! Fetched sites count:", sites.length);
        if (sites.length > 0) {
            console.log("First site sample:", JSON.stringify(sites[0], null, 2));
        }
    } catch (error) {
        console.error("Test Failed:", error.message);
    }
}

testSync();

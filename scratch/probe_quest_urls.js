import axios from 'axios';

const URLS = [
    "https://qcs-uat.questdiagnostics.com/services/PSCService.asmx?WSDL",
    "https://qcs-uat.questdiagnostics.com/services/CollectionSiteService.asmx?WSDL",
    "https://qcs-uat.questdiagnostics.com/services/LocationService.asmx?WSDL",
    "https://qcs-uat.questdiagnostics.com/services/SiteService.asmx?WSDL"
];

async function probe() {
    for (const url of URLS) {
        try {
            console.log("Probing:", url);
            const res = await axios.get(url);
            console.log("SUCCESS found WSDL at:", url);
            return;
        } catch (e) {
            console.log("Failed:", url);
        }
    }
}

probe();

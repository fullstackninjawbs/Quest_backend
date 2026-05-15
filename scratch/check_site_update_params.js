import axios from 'axios';

const WSDL_URL = "https://qcs-uat.questdiagnostics.com/services/ESService.asmx?WSDL";

async function checkUpdate() {
    try {
        const response = await axios.get(WSDL_URL);
        const wsdl = response.data;
        const start = wsdl.indexOf('<s:element name="UpdateRetrieveCollectionSiteDetails">');
        const end = wsdl.indexOf('</s:element>', start);
        console.log(wsdl.substring(start, end + 12));
    } catch (error) {
        console.log("Error:", error.message);
    }
}

checkUpdate();

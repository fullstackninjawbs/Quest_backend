import axios from 'axios';

const WSDL_URL = "https://qcs-uat.questdiagnostics.com/services/ESPService.asmx?WSDL";

async function checkWSDL() {
    try {
        const response = await axios.get(WSDL_URL);
        const wsdl = response.data;
        
        console.log("Searching for site related methods...");
        const methods = wsdl.match(/<s:element name="(\w+)"/g);
        if (methods) {
            const list = methods.map(m => m.match(/"(\w+)"/)[1]);
            console.log("Found methods:", list.filter(m => m.includes("Site") || m.includes("PSC") || m.includes("List") || m.includes("Location")));
        }
    } catch (error) {
        console.error("Error:", error.message);
    }
}

checkWSDL();

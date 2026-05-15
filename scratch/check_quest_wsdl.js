import axios from 'axios';

const WSDL_URL = "https://qcs-uat.questdiagnostics.com/services/ESPService.asmx?WSDL";

async function checkWSDL() {
    try {
        console.log("Fetching WSDL from:", WSDL_URL);
        const response = await axios.get(WSDL_URL);
        console.log("WSDL fetched successfully.");
        // We'll save it to a file so I can read it
        console.log(response.data.substring(0, 5000)); // Print first 5000 chars
    } catch (error) {
        console.error("Error fetching WSDL:", error.message);
        if (error.response) {
            console.error("Status:", error.response.status);
            console.error("Data:", error.response.data);
        }
    }
}

checkWSDL();

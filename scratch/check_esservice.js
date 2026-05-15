import axios from 'axios';

const WSDL_URL = "https://qcs-uat.questdiagnostics.com/services/ESService.asmx?WSDL";

async function checkWSDL() {
    try {
        console.log("Fetching WSDL from:", WSDL_URL);
        const response = await axios.get(WSDL_URL);
        console.log("WSDL fetched successfully.");
        const wsdl = response.data;
        console.log("Operations found:");
        const ops = wsdl.match(/<wsdl:operation name="(\w+)"/g);
        if (ops) {
            console.log(ops.map(o => o.match(/"(\w+)"/)[1]).join(", "));
        }
    } catch (error) {
        console.log("Failed:", error.message);
    }
}

checkWSDL();

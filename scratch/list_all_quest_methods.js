import axios from 'axios';

const WSDL_URL = "https://qcs-uat.questdiagnostics.com/services/ESPService.asmx?WSDL";

async function checkWSDL() {
    try {
        const response = await axios.get(WSDL_URL);
        const wsdl = response.data;
        
        console.log("All method elements found:");
        const methods = wsdl.match(/<wsdl:operation name="(\w+)"/g);
        if (methods) {
            const list = methods.map(m => m.match(/"(\w+)"/)[1]);
            // Filter unique
            const uniqueMethods = [...new Set(list)];
            console.log(uniqueMethods.join(", "));
        }
    } catch (error) {
        console.error("Error:", error.message);
    }
}

checkWSDL();

import fs from 'fs';
import axios from 'axios';

async function checkNS() {
    const response = await axios.get("https://qcs-uat.questdiagnostics.com/services/ESService.asmx?WSDL");
    const wsdl = response.data;
    const match = wsdl.match(/targetNamespace="([^"]+)"/);
    console.log("Target Namespace:", match ? match[1] : "Not found");
}

checkNS();

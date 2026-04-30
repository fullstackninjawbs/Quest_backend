import {
    QUEST_USERNAME,
    QUEST_PASSWORD,
    QUEST_SOAP_URL,
    QUEST_ACCOUNT_ID,
    NODE_ENV
} from './env.js';

const questConfig = {
    username: QUEST_USERNAME,
    password: QUEST_PASSWORD,
    soapUrl: QUEST_SOAP_URL || 'https://qcs-uat.questdiagnostics.com/services/ESPService.asmx',
    accountId: QUEST_ACCOUNT_ID,
    isProduction: NODE_ENV === 'production',

    // SOAP headers configuration for ASMX service
    headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': 'http://wssim.labone.com/CreateOrder'
    }
};

export default questConfig;

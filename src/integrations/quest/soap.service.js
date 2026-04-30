import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';
import questConfig from '../../config/quest.config.js';
import { buildCreateOrderXml } from './templates/createOrder.template.js';
import AppError from '../../utils/AppError.js';

const parser = new XMLParser({
    ignoreAttributes: false,
    removeNSPrefix: true
});

/**
 * Handles the communication with Quest ESP SOAP API (ASMX Service)
 * Based on Specification v2.1
 */
export const callCreateOrder = async (orderData) => {
    try {
        const orderXml = buildCreateOrderXml(orderData);

        // Wrap the orderXml in the ASMX SOAP Envelope
        const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <CreateOrder xmlns="http://wssim.labone.com/">
      <username>${questConfig.username}</username>
      <password>${questConfig.password}</password>
      <orderXml><![CDATA[${orderXml}]]></orderXml>
    </CreateOrder>
  </soap:Body>
</soap:Envelope>`;

        if (process.env.NODE_ENV !== 'production') {
            console.log('Sending Quest Request for user:', questConfig.username);
            // Write to a scratch file for verification
            import('fs').then(fs => {
                fs.writeFileSync('quest_request_debug.xml', soapEnvelope);
            });
        }

        const response = await axios.post(questConfig.soapUrl, soapEnvelope, {
            headers: questConfig.headers,
            timeout: 30000
        });

        const parsedEnvelope = parser.parse(response.data);

        // ASP.NET services wrap the result in CreateOrderResult
        const soapBody = parsedEnvelope.Envelope?.Body;
        const createOrderResponse = soapBody?.CreateOrderResponse;
        const resultXml = createOrderResponse?.CreateOrderResult;

        if (!resultXml) {
            throw new AppError('Invalid response from Quest API (Missing Result).', 500);
        }

        if (process.env.NODE_ENV !== 'production') {
            console.log('--- QUEST RESULT XML ---');
            console.log(resultXml);
            console.log('------------------------');
        }

        // The result is usually another XML string inside the result tag
        const resultData = parser.parse(resultXml);
        const methodResponse = resultData.QuestMethodResponse;

        if (methodResponse?.ResponseStatusID === 'SUCCESS') {
            return {
                questOrderId: methodResponse.QuestOrderID,
                referenceTestId: methodResponse.ReferenceTestID,
                rawXmlResponse: response.data,
                parsedResponse: methodResponse
            };
        } else {
            const error = methodResponse?.Errors?.Error;
            const errorMsg = Array.isArray(error)
                ? error.map(e => e.ErrorDetail).join(', ')
                : (error?.ErrorDetail || 'Quest API rejected the order.');

            throw new AppError(errorMsg, 400);
        }
    } catch (error) {
        if (error.response) {
            const errorParsed = parser.parse(error.response.data);
            const fault = errorParsed.Envelope?.Body?.Fault;
            const message = fault?.faultstring || 'Quest SOAP Fault occurred';
            throw new AppError(message, 400);
        } else if (error.request) {
            throw new AppError('Quest API timed out. Please check the order status later.', 504);
        } else if (error instanceof AppError) {
            throw error;
        } else {
            throw new AppError(`Integration Error: ${error.message}`, 500);
        }
    }
};

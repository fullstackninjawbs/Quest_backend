import axios from 'axios';
import { parseStringPromise } from 'xml2js';

/**
 * Service to handle Quest Diagnostics API integrations.
 * Uses ESService.asmx for Collection Site Directory Sync.
 */

class QuestService {
    constructor() {
        this.url = process.env.QUEST_UAT_ES_URL || "https://qcs-uat.questdiagnostics.com/services/ESService.asmx";
        this.username = process.env.QUEST_UAT_USERNAME;
        this.password = process.env.QUEST_UAT_PASSWORD;
    }

    /**
     * Helper to construct SOAP request
     */
    async _soapRequest(action, bodyXml) {
        const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    ${bodyXml}
  </soap:Body>
</soap:Envelope>`;

        const response = await axios.post(this.url, soapEnvelope, {
            headers: {
                'Content-Type': 'text/xml; charset=utf-8',
                'SOAPAction': `http://wssim.labone.com/${action}`
            },
            timeout: 300000, 
            maxContentLength: Infinity,
            maxBodyLength: Infinity
        });

        return response.data;
    }

    /**
     * Maps raw Quest XML site data to our Database model
     */
    _mapSiteData(site) {
        const addr = site.Address?.[0] || {};
        const isTrue = (val) => val?.[0] === 'true';

        return {
            siteCode: site.SiteCode?.[0],
            name: addr.Name?.[0] || "Unknown Site",
            status: site.Status?.[0],
            address: {
                line1: (addr.Address1?.[0] || "").trim(),
                line2: (addr.Address2?.[0] || "").trim(),
                city: (addr.City?.[0] || "").trim(),
                state: (addr.State?.[0] || "").trim(),
                zip: (addr.Zip?.[0] || "").trim(),
                county: (addr.County?.[0] || "").trim()
            },
            phone: (site.PrimaryPhoneNumber?.[0] || "").trim(),
            secondaryPhone: (site.SecondaryPhoneNumber?.[0] || "").trim(),
            fax: site.FaxNumber?.[0] || "",
            email: site.EmailAddress?.[0] || "",
            website: site.Website?.[0] || "",
            hours: site.HoursOfOperation?.[0] || "",
            
            coordinates: {
                lat: parseFloat(site.Latitude?.[0] || 0),
                lng: parseFloat(site.Longitude?.[0] || 0)
            },
            
            onSiteCollection: isTrue(site.OnSiteCollection),
            courierPickup: site.CourierPickup?.[0] === '1',
            pscIndicator: site.PSCIndicator?.[0] === '1',
            preferredProvider: site.PreferredProviderIndicator?.[0] === '1',
            openToPublic: isTrue(site.OpenToPublic),
            appointmentRequired: isTrue(site.AppointmentSchedulingFlag),
            
            hoursAfter5: isTrue(site.HoursAfter5),
            hours24_7: isTrue(site.Hours24_7),
            hoursWeekend: isTrue(site.HoursWeekend),
            
            capabilities: {
                breathAlcohol: isTrue(site.BreathAlcohol) || isTrue(site.BreathAlcoholRegulated) || isTrue(site.BreathAlcoholNonRegulated),
                breathAlcoholRegulated: isTrue(site.BreathAlcoholRegulated),
                hairCollection: isTrue(site.HairCollection),
                oralFluidCollection: isTrue(site.OralFluidCollection),
                dnaCollection: isTrue(site.DnaCollection),
                observedCollection: isTrue(site.ObservedCollection),
                electronicCCF: isTrue(site.RegulatedElectronicCCF) || isTrue(site.SAPElectronicCCF) || isTrue(site.HRSElectronicCCF),
                regulatedElectronicCCF: isTrue(site.RegulatedElectronicCCF),
                sapElectronicCCF: isTrue(site.SAPElectronicCCF),
                hrsElectronicCCF: isTrue(site.HRSElectronicCCF),
                dotPhysicals: isTrue(site.FederallyRegulatedPhysicals),
                collection: isTrue(site.Collection),
                testing: isTrue(site.Testing),
                paramedical: isTrue(site.ParamedicalServices)
            },

            technicalFlags: {
                airportSecurity: isTrue(site.AirportSecuritySite),
                billingSupport: isTrue(site.BillingSupportSite),
                histoCyto: isTrue(site.HistoCyto),
                logistics: isTrue(site.Logistics)
            },
            
            isActive: site.Status?.[0] === '1'
        };
    }

    /**
     * Fetches all collection sites from Quest ESP Web Services.
     */
    async fetchAllCollectionSites() {
        console.log(`QuestService: Starting Full Directory Sync for ${this.username}...`);

        const bodyXml = `<FullRetrieveCollectionSiteDetails xmlns="http://wssim.labone.com/">
      <username>${this.username}</username>
      <password>${this.password}</password>
    </FullRetrieveCollectionSiteDetails>`;

        try {
            const xmlResponse = await this._soapRequest('FullRetrieveCollectionSiteDetails', bodyXml);
            const result = await parseStringPromise(xmlResponse);
            
            const innerXml = result['soap:Envelope']['soap:Body'][0]['FullRetrieveCollectionSiteDetailsResponse'][0]['FullRetrieveCollectionSiteDetailsResult'][0];
            const data = await parseStringPromise(innerXml);
            const sitesRaw = data.CollectionSiteDetails?.CollectionSiteDetail || [];
            
            console.log(`QuestService: Mapping ${sitesRaw.length} sites with full 54-field detail...`);

            return sitesRaw.map(this._mapSiteData.bind(this));
        } catch (error) {
            console.error("QuestService Error:", error.message);
            throw new Error("Failed to sync with Quest API: " + error.message);
        }
    }

    /**
     * Incremental sync for recently updated sites.
     */
    async fetchUpdatedSites(fromDate) {
        const dateStr = fromDate.toISOString();
        const bodyXml = `<UpdateRetrieveCollectionSiteDetails xmlns="http://wssim.labone.com/">
      <username>${this.username}</username>
      <password>${this.password}</password>
      <fromDate>${dateStr}</fromDate>
    </UpdateRetrieveCollectionSiteDetails>`;

        try {
            const xmlResponse = await this._soapRequest('UpdateRetrieveCollectionSiteDetails', bodyXml);
            const result = await parseStringPromise(xmlResponse);
            const innerXml = result['soap:Envelope']['soap:Body'][0]['UpdateRetrieveCollectionSiteDetailsResponse'][0]['UpdateRetrieveCollectionSiteDetailsResult'][0];
            const data = await parseStringPromise(innerXml);
            const sitesRaw = data.CollectionSiteDetails?.CollectionSiteDetail || [];
            
            return sitesRaw.map(this._mapSiteData.bind(this));
        } catch (error) {
            throw new Error("Failed to incremental sync with Quest API: " + error.message);
        }
    }
}

export default new QuestService();

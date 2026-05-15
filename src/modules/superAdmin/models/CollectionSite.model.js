import mongoose from "mongoose";

const collectionSiteSchema = new mongoose.Schema(
    {
        siteCode: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        status: String, // Raw status from Quest (e.g. "1")
        address: {
            line1: String,
            line2: String,
            city: String,
            state: String,
            zip: String,
            county: String,
        },
        phone: String,
        secondaryPhone: String,
        fax: String,
        email: String,
        website: String,
        hours: String,
        
        // Geospatial Coordinates
        coordinates: {
            lat: { type: Number, default: 0 },
            lng: { type: Number, default: 0 }
        },
        
        // Capabilities & Flags
        onSiteCollection: { type: Boolean, default: false },
        courierPickup: { type: Boolean, default: false },
        pscIndicator: { type: Boolean, default: false },
        preferredProvider: { type: Boolean, default: false },
        openToPublic: { type: Boolean, default: false },
        appointmentRequired: { type: Boolean, default: false },
        
        // Time Flags
        hoursAfter5: { type: Boolean, default: false },
        hours24_7: { type: Boolean, default: false },
        hoursWeekend: { type: Boolean, default: false },
        
        // Services/Capabilities
        capabilities: {
            breathAlcohol: { type: Boolean, default: false },
            breathAlcoholRegulated: { type: Boolean, default: false },
            hairCollection: { type: Boolean, default: false },
            oralFluidCollection: { type: Boolean, default: false },
            dnaCollection: { type: Boolean, default: false },
            observedCollection: { type: Boolean, default: false },
            electronicCCF: { type: Boolean, default: false }, // Aggregated
            regulatedElectronicCCF: { type: Boolean, default: false },
            sapElectronicCCF: { type: Boolean, default: false },
            hrsElectronicCCF: { type: Boolean, default: false },
            dotPhysicals: { type: Boolean, default: false },
            collection: { type: Boolean, default: false },
            testing: { type: Boolean, default: false },
            paramedical: { type: Boolean, default: false }
        },

        // For the "Everything else" flags
        technicalFlags: {
            airportSecurity: { type: Boolean, default: false },
            billingSupport: { type: Boolean, default: false },
            histoCyto: { type: Boolean, default: false },
            logistics: { type: Boolean, default: false }
        },

        isActive: {
            type: Boolean,
            default: true,
        },
        lastSyncedAt: {
            type: Date,
            default: Date.now,
        }
    },
    { timestamps: true }
);

// Indexes
collectionSiteSchema.index({ "address.zip": 1 });
collectionSiteSchema.index({ "address.city": 1 });

const CollectionSite = mongoose.model("CollectionSite", collectionSiteSchema);
export default CollectionSite;

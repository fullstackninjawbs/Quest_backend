import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
    employerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employer',
        required: true,
        index: true
    },
    clientReferenceId: {
        type: String,
        unique: true,
        sparse: true // Allows multiple nulls if not required, but better to populate it
    },
    employee: {
        firstName: { type: String, required: true },
        lastName: { type: String, required: true },
        email: { type: String, required: true },
        phone: { type: String, required: true },
        dob: { type: Date, required: true },
        gender: { type: String, enum: ['M', 'F'], required: true },
        ssnLast4: { type: String }
    },
    test: {
        testCode: { type: String, required: true },
        testName: { type: String, required: true },
        isDOT: { type: Boolean, default: false },
        unitCode: { type: String }, // Required for Non-DOT usually
        accountNumber: { type: String, required: true }
    },
    collectionSite: {
        siteId: { type: String },
        name: { type: String },
        address: { type: String },
        phone: { type: String },
        snapshot: { type: Object } // Full site metadata at time of order
    },
    scheduling: {
        mode: { 
            type: String, 
            enum: ['walk_in', 'schedule_with_quest'], 
            default: 'walk_in' 
        },
        scheduledDate: { type: Date }
    },
    questResponse: {
        questOrderId: { type: String },
        referenceTestId: { type: String },
        rawXmlResponse: { type: String },
        parsedResponse: { type: Object }
    },
    status: {
        type: String,
        enum: ['pending', 'created', 'expired', 'collected', 'completed', 'cancelled', 'failed'],
        default: 'pending',
        index: true
    },
    auditTrail: [
        {
            action: { type: String },
            status: { type: String },
            timestamp: { type: Date, default: Date.now },
            note: { type: String },
            performedBy: { type: mongoose.Schema.Types.ObjectId, refPath: 'auditTrail.performedByType' },
            performedByType: { type: String, enum: ['Employer', 'SuperAdmin'] }
        }
    ]
}, { timestamps: true });

// Index for searching by Quest Order ID
orderSchema.index({ 'questResponse.questOrderId': 1 });

const Order = mongoose.model('Order', orderSchema);

export default Order;

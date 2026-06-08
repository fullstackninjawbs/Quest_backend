import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            refPath: 'userModel',
            index: true
        },
        userModel: {
            type: String,
            required: true,
            enum: ['Employer', 'SuperAdmin']
        },
        token: {
            type: String,
            required: true,
            index: true
        },
        device: {
            type: String,
            default: 'Unknown Device'
        },
        ip: {
            type: String,
            default: 'Unknown IP'
        },
        location: {
            type: String,
            default: 'Unknown Location'
        },
        isMobile: {
            type: Boolean,
            default: false
        },
        lastActive: {
            type: Date,
            default: Date.now
        }
    },
    { timestamps: true }
);

const Session = mongoose.model("Session", sessionSchema);
export default Session;

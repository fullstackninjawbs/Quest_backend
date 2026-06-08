import mongoose from "mongoose";

const loginHistorySchema = new mongoose.Schema(
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
        status: {
            type: String,
            enum: ['Success', 'Fail'],
            required: true
        }
    },
    { timestamps: true }
);

const LoginHistory = mongoose.model("LoginHistory", loginHistorySchema);
export default LoginHistory;

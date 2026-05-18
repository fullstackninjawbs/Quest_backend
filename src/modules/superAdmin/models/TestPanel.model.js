import mongoose from "mongoose";

const testPanelSchema = new mongoose.Schema(
    {
        panel_id: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            required: true,
            trim: true,
        },
        price: {
            type: String,
            required: true,
            trim: true, // e.g., "$49.00"
        },
        icon: {
            type: String,
            default: "Package",
            trim: true,
        },
        unitCode: {
            type: String,
            trim: true,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

const TestPanel = mongoose.model("TestPanel", testPanelSchema);
export default TestPanel;

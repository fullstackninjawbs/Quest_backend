import mongoose from "mongoose";

const testOptionSchema = new mongoose.Schema(
    {
        category: {
            type: String,
            required: true,
            enum: ["TEST_TYPE", "REASON_FOR_TEST", "COLLECTION_TYPE"],
        },
        label: {
            type: String,
            required: true,
            trim: true,
        },
        value: {
            type: String,
            required: true,
            trim: true,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

// Index to ensure unique values per category
testOptionSchema.index({ category: 1, value: 1 }, { unique: true });

const TestOption = mongoose.model("TestOption", testOptionSchema);
export default TestOption;

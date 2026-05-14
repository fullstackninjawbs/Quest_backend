import mongoose from "mongoose";

const employeeSchema = new mongoose.Schema(
    {
        employer_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Employer",
            required: [true, "Employer ID is required"],
        },
        employee_id: {
            type: String,
            trim: true,
            // This is the human-readable ID (e.g., EMP-001 or ASC-123)
        },
        first_name: {
            type: String,
            required: [true, "First name is required"],
            trim: true,
        },
        last_name: {
            type: String,
            required: [true, "Last name is required"],
            trim: true,
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            lowercase: true,
            trim: true,
        },
        phone: {
            type: String,
            required: [true, "Phone number is required"],
            trim: true,
        },
        license_number: {
            type: String,
            trim: true,
        },
        dob: {
            type: Date,
        },
        zip_code: {
            type: String,
            trim: true,
        },
        state: {
            type: String,
            trim: true,
        },
        der_name: {
            type: String,
            trim: true,
        },
        der_phone: {
            type: String,
            trim: true,
        },
        type: {
            type: String,
            enum: ["DOT", "NON-DOT"],
            default: "DOT",
        },
        status: {
            type: String,
            enum: ["Active", "Inactive"],
            default: "Active",
        },
        last_tested: {
            type: Date,
        },
        test_name: {
            type: String,
            trim: true,
        },
        test_result: {
            type: String,
            trim: true,
        },
    },
    { timestamps: true }
);

// Indexing for faster queries and uniqueness
// Email and Employee ID should be unique for a specific employer
employeeSchema.index({ employer_id: 1, email: 1 }, { unique: true });
employeeSchema.index({ employer_id: 1, employee_id: 1 }, { unique: true });

const Employee = mongoose.model("Employee", employeeSchema);
export default Employee;

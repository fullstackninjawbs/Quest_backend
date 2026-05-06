import crypto from "crypto";
import Employee from "../models/employee.model.js";
import catchAsync from "../../../utils/catchAsync.js";
import AppError from "../../../utils/AppError.js";

/**
 * @desc    Add a single employee
 * @route   POST /api/v1/employer/employee/add
 * @access  Private (Employer)
 */
export const addEmployee = catchAsync(async (req, res, next) => {
    const {
        employee_id,
        first_name,
        last_name,
        email,
        phone,
        license_number,
        dob,
        zip_code,
        state,
        der_name,
        der_phone,
        type,
        status
    } = req.body;

    // Check if email already exists for this employer
    const existingEmployee = await Employee.findOne({
        employer_id: req.user._id,
        email: email.toLowerCase()
    });

    if (existingEmployee) {
        return next(new AppError("An employee with this email already exists in your records.", 400));
    }

    // Logic: Use a Short 8-character ID if employee_id is not provided
    let finalEmployeeId = employee_id;
    if (!finalEmployeeId) {
        // Generates a short, clean ID like "A1B2C3D4"
        finalEmployeeId = crypto.randomBytes(4).toString("hex").toUpperCase();
    }

    const newEmployee = await Employee.create({
        employer_id: req.user._id,
        employee_id: finalEmployeeId,
        first_name,
        last_name,
        email: email.toLowerCase(),
        phone,
        license_number,
        dob,
        zip_code,
        state,
        der_name,
        der_phone,
        type,
        status
    });

    res.status(201).json({
        success: true,
        message: "Employee added successfully.",
        data: newEmployee
    });
});

/**
 * @desc    Get all employees for the logged-in employer
 * @route   GET /api/v1/employer/employee/list
 * @access  Private (Employer)
 */
export const getEmployees = catchAsync(async (req, res, next) => {
    const { search, type, status } = req.query;

    // Build Query
    const query = { employer_id: req.user._id };

    // Filtering
    if (type && type !== 'ALL') query.type = type;
    if (status && status !== 'ALL') query.status = status;

    // Searching (Name, Email, or License)
    if (search) {
        query.$or = [
            { first_name: { $regex: search, $options: "i" } },
            { last_name: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
            { license_number: { $regex: search, $options: "i" } },
            { employee_id: { $regex: search, $options: "i" } }
        ];
    }

    const employees = await Employee.find(query).sort("-createdAt");

    res.status(200).json({
        success: true,
        message: "Employees fetched successfully.",
        count: employees.length,
        data: employees
    });
});

/**
 * @desc    Bulk Add Employees via CSV
 * @route   POST /api/v1/employer/employee/add-csv
 * @access  Private (Employer)
 */
import fs from "fs";
import csv from "csv-parser";

export const addEmployeeCSV = catchAsync(async (req, res, next) => {
    if (!req.file) {
        return next(new AppError("Please upload a CSV file.", 400));
    }

    const filePath = req.file.path;
    const employeesToInsert = [];
    const errors = [];
    let rowNumber = 1; // Start counting rows (1 is usually header)

    // Helper to cleanup file
    const cleanup = () => {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    };

    // Step 4: Stream and Parse CSV
    const stream = fs.createReadStream(filePath).pipe(csv());

    for await (const row of stream) {
        rowNumber++;

        // Basic Validation (Step 4)
        const firstName = row.first_name || row.FirstName;
        const lastName = row.last_name || row.LastName;
        const email = row.email || row.Email;

        if (!firstName || !lastName || !email) {
            errors.push({
                row: rowNumber,
                error: "Missing required fields (First Name, Last Name, or Email)",
                data: row
            });
            continue;
        }

        // Logic: Use Short ID if missing (Step 4 & 5)
        const employeeId = row.employee_id || row.EmployeeId || crypto.randomBytes(4).toString("hex").toUpperCase();

        employeesToInsert.push({
            employer_id: req.user._id,
            employee_id: employeeId,
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            email: email.toLowerCase().trim(),
            phone: row.phone || row.Phone || "-",
            license_number: row.license_number || row.License || "-",
            type: (row.type || "DOT").toUpperCase(),
            status: (row.status || "Active"),
            zip_code: row.zip_code || row.Zip || "-",
            state: row.state || row.State || "-",
            der_name: row.der_name || "-",
            der_phone: row.der_phone || "-"
        });
    }

    // Step 5: Bulk Insert
    let successCount = 0;
    if (employeesToInsert.length > 0) {
        try {
            // ordered: false allows continuing even if some rows fail (e.g. duplicates)
            const result = await Employee.insertMany(employeesToInsert, { ordered: false });
            successCount = result.length;
        } catch (err) {
            // Handle duplicate errors from MongoDB
            if (err.writeErrors) {
                successCount = err.nInserted;
                err.writeErrors.forEach(writeError => {
                    errors.push({
                        row: "N/A (Duplicate or Validation)",
                        error: writeError.errmsg,
                        data: writeError.op.email
                    });
                });
            } else {
                cleanup();
                return next(new AppError("Bulk insert failed: " + err.message, 500));
            }
        }
    }

    cleanup(); // Step 7: Cleanup

    res.status(200).json({
        success: true,
        message: "Employee import process completed.",
        summary: {
            totalProcessed: rowNumber - 1,
            successCount,
            errorCount: errors.length,
        },
        errors: errors.length > 0 ? errors : null
    });
});

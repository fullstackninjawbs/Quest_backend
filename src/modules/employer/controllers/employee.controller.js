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
    const { search, type, status, page, limit } = req.query;

    const pageNumber = parseInt(page) || 1;
    const limitNumber = parseInt(limit) || 10;
    const skip = (pageNumber - 1) * limitNumber;

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

    const totalEmployees = await Employee.countDocuments(query);
    const employees = await Employee.find(query).sort("-createdAt").skip(skip).limit(limitNumber);

    res.status(200).json({
        success: true,
        message: "Employees fetched successfully.",
        count: employees.length,
        total: totalEmployees,
        page: pageNumber,
        totalPages: Math.ceil(totalEmployees / limitNumber),
        data: employees
    });
});

export const uploadProgressMap = new Map();

export const getUploadProgress = catchAsync(async (req, res, next) => {
    const { uploadId } = req.params;
    const progress = uploadProgressMap.get(uploadId) || 0;
    res.status(200).json({ success: true, progress });
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
    const uploadId = req.query.uploadId || req.body.uploadId;
    if (uploadId) uploadProgressMap.set(uploadId, 10); // initial parsing state

    const bulkOps = [];
    const errors = [];
    let rowNumber = 1;

    const cleanup = () => {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
        if (uploadId) {
            // keep it 100 for a short while, then delete? 
            // no need to delete immediately, it will be handled by the FE completing.
            // Or delete after 1 minute.
            setTimeout(() => uploadProgressMap.delete(uploadId), 60000);
        }
    };

    const fileSize = fs.statSync(filePath).size;
    let processedBytes = 0;
    const readStream = fs.createReadStream(filePath);

    readStream.on('data', (chunk) => {
        processedBytes += chunk.length;
        if (uploadId) {
            // parsing takes up to 40% (progress from 10 to 50)
            const parsingProgress = Math.floor((processedBytes / fileSize) * 40);
            uploadProgressMap.set(uploadId, 10 + parsingProgress);
        }
    });

    const stream = readStream.pipe(csv());

    for await (const row of stream) {
        rowNumber++;

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

        const employeeId = row.employee_id || row.EmployeeId || crypto.randomBytes(4).toString("hex").toUpperCase();

        bulkOps.push({
            updateOne: {
                filter: { employer_id: req.user._id, email: email.toLowerCase().trim() },
                update: {
                    $set: {
                        first_name: firstName.trim(),
                        last_name: lastName.trim(),
                        phone: row.phone || row.Phone || "-",
                        license_number: row.license_number || row.License || "-",
                        type: (row.type || "DOT").toUpperCase(),
                        status: (row.status || "Active"),
                        zip_code: row.zip_code || row.Zip || "-",
                        state: row.state || row.State || "-",
                        der_name: row.der_name || "-",
                        der_phone: row.der_phone || "-"
                    },
                    $setOnInsert: {
                        employee_id: employeeId
                    }
                },
                upsert: true
            }
        });
    }

    let successCount = 0;
    if (bulkOps.length > 0) {
        const batchSize = 100;
        let processedOps = 0;

        for (let i = 0; i < bulkOps.length; i += batchSize) {
            const batch = bulkOps.slice(i, i + batchSize);
            try {
                const result = await Employee.bulkWrite(batch, { ordered: false });
                successCount += (result.upsertedCount || 0) + (result.modifiedCount || 0) + (result.insertedCount || 0) + (result.matchedCount || 0);
            } catch (err) {
                if (err.writeErrors) {
                    successCount += (batch.length - err.writeErrors.length);
                    err.writeErrors.forEach(writeError => {
                        errors.push({
                            row: "N/A (Bulk Write Error)",
                            error: writeError.errmsg,
                            data: 'Check payload/validation'
                        });
                    });
                } else {
                    cleanup();
                    return next(new AppError("Bulk write failed: " + err.message, 500));
                }
            }

            processedOps += batch.length;
            if (uploadId) {
                // writing takes up to 50% (progress from 50 to 100)
                const writeProgress = Math.floor((processedOps / bulkOps.length) * 50);
                uploadProgressMap.set(uploadId, 50 + writeProgress);
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

/**
 * @desc    Delete a single employee
 * @route   DELETE /api/v1/employer/employee/:id
 * @access  Private (Employer)
 */
export const deleteEmployee = catchAsync(async (req, res, next) => {
    const { id } = req.params;

    const employee = await Employee.findOneAndDelete({
        _id: id,
        employer_id: req.user._id // Ensure they only delete their own employees
    });

    if (!employee) {
        return next(new AppError("Employee not found or you don't have permission to delete.", 404));
    }

    res.status(200).json({
        success: true,
        message: "Employee deleted successfully."
    });
});

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

    const searchFilter = {};
    if (search) {
        const cleanSearch = search.trim();
        searchFilter.$or = [
            { first_name: { $regex: cleanSearch, $options: "i" } },
            { last_name: { $regex: cleanSearch, $options: "i" } },
            { email: { $regex: cleanSearch, $options: "i" } },
            { license_number: { $regex: cleanSearch, $options: "i" } },
            { employee_id: { $regex: cleanSearch, $options: "i" } },
            {
                $expr: {
                    $regexMatch: {
                        input: { $concat: ["$first_name", " ", "$last_name"] },
                        regex: cleanSearch,
                        options: "i"
                    }
                }
            },
            {
                $expr: {
                    $regexMatch: {
                        input: { $concat: ["$last_name", " ", "$first_name"] },
                        regex: cleanSearch,
                        options: "i"
                    }
                }
            }
        ];
    }

    // Build Query
    const query = { employer_id: req.user._id, ...searchFilter };

    // Filtering
    if (type && type !== 'ALL') query.type = type;
    if (status && status !== 'ALL') query.status = status;

    const totalEmployees = await Employee.countDocuments(query);
    const employees = await Employee.find(query).sort("-createdAt").skip(skip).limit(limitNumber);

    // Faceted Filter Counts
    const baseQuery = { employer_id: req.user._id, ...searchFilter };

    // Type counts (Status applied)
    const typeQuery = { ...baseQuery };
    if (status && status !== 'ALL') typeQuery.status = status;

    // Status counts (Type applied)
    const statusQuery = { ...baseQuery };
    if (type && type !== 'ALL') statusQuery.type = type;

    const [
        typeAllCount, typeDotCount, typeNonDotCount,
        statusAllCount, statusActiveCount, statusInactiveCount
    ] = await Promise.all([
        Employee.countDocuments(typeQuery),
        Employee.countDocuments({ ...typeQuery, type: 'DOT' }),
        Employee.countDocuments({ ...typeQuery, type: 'NON-DOT' }),
        Employee.countDocuments(statusQuery),
        Employee.countDocuments({ ...statusQuery, status: 'Active' }),
        Employee.countDocuments({ ...statusQuery, status: 'Inactive' })
    ]);

    res.status(200).json({
        success: true,
        message: "Employees fetched successfully.",
        count: employees.length,
        total: totalEmployees,
        page: pageNumber,
        totalPages: Math.ceil(totalEmployees / limitNumber),
        filterCounts: {
            type: {
                ALL: typeAllCount,
                DOT: typeDotCount,
                'NON-DOT': typeNonDotCount
            },
            status: {
                ALL: statusAllCount,
                ACTIVE: statusActiveCount,
                INACTIVE: statusInactiveCount
            }
        },
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

    const bulkOps = [];
    const errors = [];
    let rowNumber = 1;

    const cleanup = () => {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    };

    const readStream = fs.createReadStream(filePath);

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
                    $setOnInsert: {
                        first_name: firstName.trim(),
                        last_name: lastName.trim(),
                        phone: row.phone || row.Phone || "-",
                        license_number: row.license_number || row.License || "-",
                        type: (row.type || "DOT").toUpperCase(),
                        status: (row.status || "Active"),
                        zip_code: row.zip_code || row.Zip || "-",
                        state: row.state || row.State || "-",
                        der_name: row.der_name || "-",
                        der_phone: row.der_phone || "-",
                        employee_id: employeeId
                    }
                },
                upsert: true
            }
        });
    }

    let successCount = 0;
    let duplicateCount = 0;
    if (bulkOps.length > 0) {
        const batchSize = 100;
        let processedOps = 0;

        for (let i = 0; i < bulkOps.length; i += batchSize) {
            const batch = bulkOps.slice(i, i + batchSize);
            try {
                const result = await Employee.bulkWrite(batch, { ordered: false });
                successCount += (result.upsertedCount || 0) + (result.insertedCount || 0);
                duplicateCount += (result.matchedCount || 0);
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
        }
    }


    cleanup(); // Step 7: Cleanup

    res.status(200).json({
        success: true,
        message: "Employee import process completed.",
        summary: {
            totalProcessed: rowNumber - 1,
            successCount,
            duplicateCount,
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

/**
 * @desc    Get a single employee by ID
 * @route   GET /api/v1/employer/employee/:id
 * @access  Private (Employer)
 */
export const getEmployeeById = catchAsync(async (req, res, next) => {
    const { id } = req.params;

    const employee = await Employee.findOne({
        _id: id,
        employer_id: req.user._id
    });

    if (!employee) {
        return next(new AppError("Employee not found.", 404));
    }

    res.status(200).json({
        success: true,
        data: employee
    });
});

/**
 * @desc    Update a single employee
 * @route   PUT /api/v1/employer/employee/:id
 * @access  Private (Employer)
 */
export const updateEmployee = catchAsync(async (req, res, next) => {
    const { id } = req.params;

    // Check if email is being updated to an existing one
    if (req.body.email) {
        const existingEmail = await Employee.findOne({
            email: req.body.email.toLowerCase().trim(),
            employer_id: req.user._id,
            _id: { $ne: id }
        });
        if (existingEmail) {
            return next(new AppError("Email is already used by another employee.", 400));
        }
    }

    const employee = await Employee.findOneAndUpdate(
        { _id: id, employer_id: req.user._id },
        {
            $set: {
                first_name: req.body.first_name,
                last_name: req.body.last_name,
                email: req.body.email?.toLowerCase().trim(),
                phone: req.body.phone,
                license_number: req.body.license_number,
                dob: req.body.dob,
                zip_code: req.body.zip_code,
                state: req.body.state,
                der_name: req.body.der_name,
                der_phone: req.body.der_phone,
                type: req.body.type,
                status: req.body.status
            }
        },
        { new: true, runValidators: true }
    );

    if (!employee) {
        return next(new AppError("Employee not found or you don't have permission to update.", 404));
    }

    res.status(200).json({
        success: true,
        message: "Employee updated successfully.",
        data: employee
    });
});

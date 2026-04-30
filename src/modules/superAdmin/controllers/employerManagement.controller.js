import Employer from "../../employer/models/employer.model.js";
import AuditLog from "../models/auditLog.model.js";
import catchAsync from "../../../utils/catchAsync.js";
import AppError from "../../../utils/AppError.js";

/**
 * @desc    Get Detailed Employer Profile
 * @route   GET /api/v1/super-admin/emp/:id/detail-profile
 * @access  Private (Super Admin)
 */
export const getEmployerProfile = catchAsync(async (req, res, next) => {
    const employer = await Employer.findById(req.params.id);

    if (!employer) {
        return next(new AppError("Employer not found", 404));
    }

    res.status(200).json({
        success: true,
        data: employer,
    });
});

/**
 * @desc    Update Employer Profile
 * @route   PUT /api/v1/super-admin/emp/:id/profile-edit
 * @access  Private (Super Admin)
 */
export const updateEmployerProfile = catchAsync(async (req, res, next) => {
    const employer = await Employer.findById(req.params.id);

    if (!employer) {
        return next(new AppError("Employer not found", 404));
    }

    // Define editable fields
    const allowedFields = ["company_name", "phone", "address", "business_type", "dot_number"];
    const oldData = {};
    const newData = {};
    let isChanged = false;

    allowedFields.forEach((field) => {
        if (req.body[field] !== undefined && req.body[field] !== employer[field]) {
            oldData[field] = employer[field];
            newData[field] = req.body[field];
            employer[field] = req.body[field];
            isChanged = true;
        }
    });

    if (isChanged) {
        employer.last_modified_by = req.user._id;
        employer.last_modified_at = Date.now();
        await employer.save();

        // Create Audit Log
        await AuditLog.create({
            employer_id: employer._id,
            action: "edit",
            performed_by: req.user._id,
            old_data: oldData,
            new_data: newData,
            ip_address: req.ip,
        });
    }

    res.status(200).json({
        success: true,
        message: "Employer updated successfully",
        data: employer,
    });
});

/**
 * @desc    Delete Employer Profile (Permanent)
 * @route   DELETE /api/v1/super-admin/emp/:id/delete
 * @access  Private (Super Admin)
 */
export const deleteEmployerProfile = catchAsync(async (req, res, next) => {
    const employer = await Employer.findById(req.params.id);

    if (!employer) {
        return next(new AppError("Employer not found", 404));
    }

    // Create Audit Log before deletion
    await AuditLog.create({
        employer_id: employer._id,
        action: "delete",
        performed_by: req.user._id,
        old_data: employer.toObject(),
        ip_address: req.ip,
    });

    // Hard delete from database
    await Employer.findByIdAndDelete(req.params.id);

    res.status(200).json({
        success: true,
        message: "Employer permanently deleted from database",
    });
});

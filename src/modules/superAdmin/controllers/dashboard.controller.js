const SuperAdmin = require("../models/superAdmin.model");
const Employer = require("../../employer/models/employer.model");
const catchAsync = require("../../../utils/catchAsync");
const AppError = require("../../../utils/AppError");

/**
 * @desc    Get Super Admin Profile
 * @route   GET /api/v1/super-admin/superadmin-profile
 * @access  Private (Super Admin)
 */
exports.getSuperAdminProfile = catchAsync(async (req, res, next) => {
    res.status(200).json({
        success: true,
        data: req.user,
    });
});

/**
 * @desc    Get all employers
 * @route   GET /api/v1/super-admin/emp
 * @access  Private (Super Admin)
 */
exports.getAllEmployers = catchAsync(async (req, res, next) => {
    // Filter by status if provided in query
    const filter = {};
    if (req.query.status) {
        filter.status = req.query.status;
    }

    const employers = await Employer.find(filter).sort("-createdAt");

    res.status(200).json({
        success: true,
        count: employers.length,
        data: employers,
    });
});

/**
 * @desc    Update employer status (Approve/Suspend)
 * @route   PATCH /api/v1/super-admin/emp/:id/status
 * @access  Private (Super Admin)
 */
exports.updateEmployerStatus = catchAsync(async (req, res, next) => {
    const { status } = req.body;
    
    // Validate status
    if (!["active", "suspended", "pending"].includes(status)) {
        return next(new AppError("Invalid status provided", 400));
    }

    const employer = await Employer.findByIdAndUpdate(
        req.params.id,
        { status },
        { new: true, runValidators: true }
    );

    if (!employer) {
        return next(new AppError("Employer not found", 404));
    }

    res.status(200).json({
        success: true,
        message: `Employer status updated to ${status}`,
        data: employer,
    });
});

/**
 * @desc    Get platform statistics
 * @route   GET /api/v1/super-admin/superadmin-stats
 * @access  Private (Super Admin)
 */
exports.getPlatformStats = catchAsync(async (req, res, next) => {
    const totalAdmins = await SuperAdmin.countDocuments();
    
    const employerStats = await Employer.aggregate([
        {
            $group: {
                _id: "employer",
                total: { $sum: 1 },
                active: {
                    $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] }
                },
                pending: {
                    $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] }
                }
            }
        }
    ]);

    res.status(200).json({
        success: true,
        data: {
            superAdmins: totalAdmins,
            employerStats: employerStats[0] || { total: 0, active: 0, pending: 0 }
        },
    });
});

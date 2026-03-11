const User = require("../models/user.model");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/AppError");

/**
 * @desc    Get Admin Profile
 * @route   GET /api/v1/admin/profile
 * @access  Private (Super Admin)
 */
exports.getAdminProfile = catchAsync(async (req, res, next) => {
    res.status(200).json({
        success: true,
        data: req.user,
    });
});

/**
 * @desc    Get all employers
 * @route   GET /api/v1/admin/employers
 * @access  Private (Super Admin)
 */
exports.getAllEmployers = catchAsync(async (req, res, next) => {
    // Filter by status if provided in query
    const filter = { role: "employer" };
    if (req.query.status) {
        filter.status = req.query.status;
    }

    const employers = await User.find(filter).sort("-createdAt");

    res.status(200).json({
        success: true,
        count: employers.length,
        data: employers,
    });
});

/**
 * @desc    Update employer status (Approve/Suspend)
 * @route   PATCH /api/v1/admin/employers/:id/status
 * @access  Private (Super Admin)
 */
exports.updateEmployerStatus = catchAsync(async (req, res, next) => {
    const { status } = req.body;
    
    // Validate status
    if (!["active", "suspended", "pending"].includes(status)) {
        return next(new AppError("Invalid status provided", 400));
    }

    const employer = await User.findOneAndUpdate(
        { _id: req.params.id, role: "employer" },
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
 * @route   GET /api/v1/admin/stats
 * @access  Private (Super Admin)
 */
exports.getPlatformStats = catchAsync(async (req, res, next) => {
    const stats = await User.aggregate([
        {
            $group: {
                _id: "$role",
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
        data: stats,
    });
});

const User = require("../models/user.model");
const catchAsync = require("../utils/catchAsync");

/**
 * @desc    Get Employer Profile
 * @route   GET /api/v1/employer/profile
 * @access  Private (Employer)
 */
exports.getEmployerProfile = catchAsync(async (req, res, next) => {
    res.status(200).json({
        success: true,
        data: req.user,
    });
});

/**
 * @desc    Update Employer Profile
 * @route   PATCH /api/v1/employer/profile
 * @access  Private (Employer)
 */
exports.updateEmployerProfile = catchAsync(async (req, res, next) => {
    const { name, phone, company_name, address } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        { name, phone, company_name, address },
        { new: true, runValidators: true }
    );

    res.status(200).json({
        success: true,
        data: updatedUser,
    });
});

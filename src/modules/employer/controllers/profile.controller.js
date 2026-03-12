const Employer = require("../models/employer.model");
const catchAsync = require("../../../utils/catchAsync");

/**
 * @desc    Get Employer Profile
 * @route   GET /api/v1/employer/employer-profile
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
 * @route   PATCH /api/v1/employer/employer-profile
 * @access  Private (Employer)
 */
exports.updateEmployerProfile = catchAsync(async (req, res, next) => {
    const { first_name, last_name, phone, company_name, address } = req.body;

    const updatedUser = await Employer.findByIdAndUpdate(
        req.user._id,
        { first_name, last_name, phone, company_name, address },
        { new: true, runValidators: true }
    );

    res.status(200).json({
        success: true,
        data: updatedUser,
    });
});

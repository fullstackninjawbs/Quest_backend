import Employer from "../models/employer.model.js";
import catchAsync from "../../../utils/catchAsync.js";

export const getEmployerProfile = catchAsync(async (req, res, next) => {
    res.status(200).json({
        success: true,
        data: req.user,
    });
});


export const updateEmployerProfile = catchAsync(async (req, res, next) => {
    const { first_name, last_name, phone, company_name, address, title } = req.body;

    const updatedUser = await Employer.findByIdAndUpdate(
        req.user._id,
        { first_name, last_name, phone, company_name, address, title },
        { new: true, runValidators: true }
    );

    res.status(200).json({
        success: true,
        data: updatedUser,
    });
});

export const deleteOwnProfile = catchAsync(async (req, res, next) => {
    await Employer.findByIdAndDelete(req.user._id);

    res.status(200).json({
        success: true,
        message: "Your account has been permanently deleted",
    });
});

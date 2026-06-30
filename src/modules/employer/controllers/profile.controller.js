import Employer from "../models/employer.model.js";
import catchAsync from "../../../utils/catchAsync.js";

export const getEmployerProfile = catchAsync(async (req, res, next) => {
    res.status(200).json({
        success: true,
        data: req.user,
    });
});


export const updateEmployerProfile = catchAsync(async (req, res, next) => {
    const { 
        first_name, last_name, phone, company_name, address, title, timezone, language,
        legal_name, dba_name, industry, founded_year, employee_count, dot_number, usdot, mc_mx_number, contact_phone, contact_email, public_industry,
        hq_street, hq_suite, hq_city, hq_state, hq_zip, same_as_hq, mail_street, mail_suite, mail_city, mail_state, mail_zip
    } = req.body;

    const updateFields = { 
        first_name, last_name, phone, company_name, address, title, timezone, language,
        legal_name, dba_name, industry, founded_year, employee_count, dot_number, usdot, mc_mx_number, contact_phone, contact_email, public_industry,
        hq_street, hq_suite, hq_city, hq_state, hq_zip, same_as_hq, mail_street, mail_suite, mail_city, mail_state, mail_zip
    };

    // Remove undefined fields so we only update what was actually provided
    Object.keys(updateFields).forEach(key => {
        if (updateFields[key] === undefined) {
            delete updateFields[key];
        }
    });

    const updatedUser = await Employer.findByIdAndUpdate(
        req.user._id,
        updateFields,
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

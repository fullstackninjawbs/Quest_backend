import Employer from "../models/employer.model.js";
import catchAsync from "../../../utils/catchAsync.js";
import { logEmployerAudit } from "../utils/auditLogger.js";

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
        hq_street, hq_suite, hq_city, hq_state, hq_zip, same_as_hq, mail_street, mail_suite, mail_city, mail_state, mail_zip,
        legalEntityName, taxIdType, taxId, termsAccepted, termsAcceptedAt, w9FileUrl, w9FileName,
        labAccountQuest, labAccountLabcorp, labAccountEscreen, labAccountCrl,
        labLinkedQuest, labLinkedLabcorp, labLinkedEscreen, labLinkedCrl,
        labLinkedDateQuest, labLinkedDateLabcorp, labLinkedDateEscreen, labLinkedDateCrl,
        derFullName, derTitle, derEmail, derPhone,
        mroName, mroPhone, mroEmail, mroAddress,
        consortiumProvider, consortiumMemberId, consortiumRandomRate,
        certifyCompliance, policyFileName, policyFileUrl,
        primaryColor, accentColor, footerText, showLogoOnPassport, replacesDefaultMark, companyLogoUrl, companyLogoName
    } = req.body;

    const updateFields = { 
        first_name, last_name, phone, company_name, address, title, timezone, language,
        legal_name, dba_name, industry, founded_year, employee_count, dot_number, usdot, mc_mx_number, contact_phone, contact_email, public_industry,
        hq_street, hq_suite, hq_city, hq_state, hq_zip, same_as_hq, mail_street, mail_suite, mail_city, mail_state, mail_zip,
        legalEntityName, taxIdType, taxId, termsAccepted, termsAcceptedAt, w9FileUrl, w9FileName,
        labAccountQuest, labAccountLabcorp, labAccountEscreen, labAccountCrl,
        labLinkedQuest, labLinkedLabcorp, labLinkedEscreen, labLinkedCrl,
        labLinkedDateQuest, labLinkedDateLabcorp, labLinkedDateEscreen, labLinkedDateCrl,
        derFullName, derTitle, derEmail, derPhone,
        mroName, mroPhone, mroEmail, mroAddress,
        consortiumProvider, consortiumMemberId, consortiumRandomRate,
        certifyCompliance, policyFileName, policyFileUrl,
        primaryColor, accentColor, footerText, showLogoOnPassport, replacesDefaultMark, companyLogoUrl, companyLogoName
    };

    // Remove undefined fields so we only update what was actually provided
    Object.keys(updateFields).forEach(key => {
        if (updateFields[key] === undefined) {
            delete updateFields[key];
        }
    });

    // Compare values before updating to find what changed
    const changedFields = [];
    const oldValues = {};
    const newValues = {};

    Object.keys(updateFields).forEach(key => {
        const oldValue = req.user[key] !== undefined ? String(req.user[key]) : "";
        const newValue = updateFields[key] !== undefined ? String(updateFields[key]) : "";
        
        if (oldValue !== newValue) {
            changedFields.push(key);
            oldValues[key] = req.user[key] !== undefined ? req.user[key] : "";
            newValues[key] = updateFields[key];
        }
    });

    const updatedUser = await Employer.findByIdAndUpdate(
        req.user._id,
        updateFields,
        { new: true, runValidators: true }
    );

    // Log Profile Update to Audit Log if there are actual changes
    if (changedFields.length > 0) {
        await logEmployerAudit({
            req,
            employerId: req.user._id,
            actionType: "PROFILE.UPDATED",
            targetEntityId: req.user._id,
            targetEntityType: "Profile",
            details: { fields: changedFields, old: oldValues, new: newValues }
        });
    }

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

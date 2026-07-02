import Employer from "../models/employer.model.js";
import catchAsync from "../../../utils/catchAsync.js";
import AppError from "../../../utils/appError.js";
import { logEmployerAudit } from "../utils/auditLogger.js";

// @desc    Add a new location/branch
// @route   POST /api/v1/employer/locations
// @access  Private/EmployerAdmin
export const addLocation = catchAsync(async (req, res, next) => {
    const employer = await Employer.findById(req.user._id);
    if (!employer) {
        return next(new AppError("Employer not found", 404));
    }

    const {
        location_name,
        is_headquarters,
        street_address,
        city,
        state,
        zip,
        local_contact_name,
        local_contact_phone,
        local_contact_email
    } = req.body;

    if (!location_name || !street_address || !city || !state || !zip) {
        return next(new AppError("Please provide all required fields (location_name, street_address, city, state, zip)", 400));
    }

    const newLoc = {
        location_name,
        is_headquarters: !!is_headquarters,
        street_address,
        city,
        state,
        zip,
        local_contact_name: local_contact_name || "",
        local_contact_phone: local_contact_phone || "",
        local_contact_email: local_contact_email || ""
    };

    employer.locations.push(newLoc);
    await employer.save();

    // Log Location Creation
    await logEmployerAudit({
        req,
        employerId: req.user._id,
        actionType: "LOCATION.CREATED",
        targetEntityId: newLoc.location_name,
        targetEntityType: "Location",
        details: newLoc
    });

    res.status(201).json({
        success: true,
        data: employer
    });
});

// @desc    Update an existing location/branch
// @route   PATCH /api/v1/employer/locations/:locationId
// @access  Private/EmployerAdmin
export const updateLocation = catchAsync(async (req, res, next) => {
    const employer = await Employer.findById(req.user._id);
    if (!employer) {
        return next(new AppError("Employer not found", 404));
    }

    const loc = employer.locations.id(req.params.locationId);
    if (!loc) {
        return next(new AppError("Location not found", 404));
    }

    const {
        location_name,
        is_headquarters,
        street_address,
        city,
        state,
        zip,
        local_contact_name,
        local_contact_phone,
        local_contact_email
    } = req.body;

    const changedFields = [];
    const oldValues = {};
    const newValues = {};

    const fieldsToCheck = [
        "location_name", "is_headquarters", "street_address", 
        "city", "state", "zip", 
        "local_contact_name", "local_contact_phone", "local_contact_email"
    ];

    fieldsToCheck.forEach(key => {
        if (req.body[key] !== undefined) {
            const oldValue = loc[key] !== undefined ? String(loc[key]) : "";
            const newValue = String(req.body[key]);
            
            if (oldValue !== newValue) {
                changedFields.push(key);
                oldValues[key] = loc[key] !== undefined ? loc[key] : "";
                newValues[key] = req.body[key];
            }
        }
    });

    if (location_name !== undefined) loc.location_name = location_name;
    if (is_headquarters !== undefined) loc.is_headquarters = !!is_headquarters;
    if (street_address !== undefined) loc.street_address = street_address;
    if (city !== undefined) loc.city = city;
    if (state !== undefined) loc.state = state;
    if (zip !== undefined) loc.zip = zip;
    if (local_contact_name !== undefined) loc.local_contact_name = local_contact_name;
    if (local_contact_phone !== undefined) loc.local_contact_phone = local_contact_phone;
    if (local_contact_email !== undefined) loc.local_contact_email = local_contact_email;

    await employer.save();

    // Log Location Update if there are actual changes
    if (changedFields.length > 0) {
        await logEmployerAudit({
            req,
            employerId: req.user._id,
            actionType: "LOCATION.UPDATED",
            targetEntityId: loc.location_name,
            targetEntityType: "Location",
            details: { fields: changedFields, old: oldValues, new: newValues }
        });
    }

    res.status(200).json({
        success: true,
        data: employer
    });
});

// @desc    Delete a location/branch
// @route   DELETE /api/v1/employer/locations/:locationId
// @access  Private/EmployerAdmin
export const deleteLocation = catchAsync(async (req, res, next) => {
    const employer = await Employer.findById(req.user._id);
    if (!employer) {
        return next(new AppError("Employer not found", 404));
    }

    const locIndex = employer.locations.findIndex(
        (loc) => loc._id.toString() === req.params.locationId
    );

    if (locIndex === -1) {
        return next(new AppError("Location not found", 404));
    }

    employer.locations.splice(locIndex, 1);
    await employer.save();

    // Log Location Deletion
    await logEmployerAudit({
        req,
        employerId: req.user._id,
        actionType: "LOCATION.DELETED",
        targetEntityId: req.params.locationId,
        targetEntityType: "Location"
    });

    res.status(200).json({
        success: true,
        data: employer
    });
});

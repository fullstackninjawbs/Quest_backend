import catchAsync from "../../../utils/catchAsync.js";
import AppError from "../../../utils/AppError.js";
import Employer from "../models/employer.model.js";

/**
 * @desc    Get current employer's notification settings
 * @route   GET /api/v1/notifications/settings
 * @access  Private (Employer)
 */
export const getNotificationSettings = catchAsync(async (req, res, next) => {
    const employer = await Employer.findById(req.user.id).select("notificationsEnabled notificationPreferences");

    if (!employer) {
        return next(new AppError("Employer not found", 404));
    }

    res.status(200).json({
        success: true,
        data: {
            notificationsEnabled: employer.notificationsEnabled,
            preferences: employer.notificationPreferences,
        },
    });
});

/**
 * @desc    Update employer's notification settings
 * @route   PUT /api/v1/notifications/settings
 * @access  Private (Employer)
 */
export const updateNotificationSettings = catchAsync(async (req, res, next) => {
    const { notificationsEnabled, preferences } = req.body;

    const updateData = {};
    if (notificationsEnabled !== undefined) {
        updateData.notificationsEnabled = notificationsEnabled;
    }
    if (preferences) {
        // We do not want to overwrite the entire object if some keys are missing, 
        // but in this case the frontend sends the whole object, so replacing it is fine.
        updateData.notificationPreferences = preferences;
    }

    const employer = await Employer.findByIdAndUpdate(
        req.user.id,
        updateData,
        {
            new: true,
            runValidators: true,
        }
    ).select("notificationsEnabled notificationPreferences");

    if (!employer) {
        return next(new AppError("Employer not found", 404));
    }

    res.status(200).json({
        success: true,
        message: "Notification settings updated successfully",
        data: {
            notificationsEnabled: employer.notificationsEnabled,
            preferences: employer.notificationPreferences,
        },
    });
});

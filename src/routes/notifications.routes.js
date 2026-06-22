import express from "express";
import employerAuth from "../modules/employer/middleware/employer.middleware.js";
import { getNotificationSettings, updateNotificationSettings } from "../modules/employer/controllers/notifications.controller.js";

const router = express.Router();

// Apply the employer auth middleware for all notification routes
router.use(employerAuth);

// @route   GET /api/v1/notifications/settings
// @route   PUT /api/v1/notifications/settings
router
    .route("/settings")
    .get(getNotificationSettings)
    .put(updateNotificationSettings);

export default router;

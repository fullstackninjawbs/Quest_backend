import express from "express";
const router = express.Router();
import {
    getSuperAdminProfile,
    getAllEmployers,
    updateEmployerStatus,
    getPlatformStats
} from "../controllers/dashboard.controller.js";
import superAdminAuth from "../middleware/superAdmin.middleware.js";

// Protect all routes below this middleware
router.use(superAdminAuth);

router.get("/profile", getSuperAdminProfile);
router.get("/employers", getAllEmployers);
router.patch("/emp/:id/status", updateEmployerStatus);
router.get("/stats", getPlatformStats);

export default router;

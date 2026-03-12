const express = require("express");
const router = express.Router();
const {
    getSuperAdminProfile,
    getAllEmployers,
    updateEmployerStatus,
    getPlatformStats
} = require("../controllers/dashboard.controller");
const superAdminAuth = require("../middleware/superAdmin.middleware");

// Protect all routes below this middleware
router.use(superAdminAuth);

router.get("/superadmin-profile", getSuperAdminProfile);
router.get("/superadmin-employers", getAllEmployers);
router.patch("/superadmin-employers/:id/status", updateEmployerStatus);
router.get("/superadmin-stats", getPlatformStats);

module.exports = router;

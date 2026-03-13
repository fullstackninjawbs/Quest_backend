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

router.get("/profile", getSuperAdminProfile);
router.get("/employers", getAllEmployers);
router.patch("/emp/:id/status", updateEmployerStatus);
router.get("/stats", getPlatformStats);

module.exports = router;

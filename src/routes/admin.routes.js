const express = require("express");
const router = express.Router();
const {
    getAllEmployers,
    updateEmployerStatus,
    getPlatformStats,
    getAdminProfile
} = require("../controllers/admin.controller");
const protect = require("../middleware/auth.middleware");
const restrictTo = require("../middleware/role.middleware");

// ─── Protect all routes below this middleware ───────────────────────────────
router.use(protect);
router.use(restrictTo("super_admin"));

router.get("/profile", getAdminProfile);
router.get("/employers", getAllEmployers);
router.patch("/employers/:id/status", updateEmployerStatus);
router.get("/stats", getPlatformStats);

module.exports = router;

const express = require("express");
const router = express.Router();

const authRoutes = require("./auth.routes");
const dashboardRoutes = require("./dashboard.routes");

// Super Admin Authentication
// Endpoints: /api/v1/super-admin/signup, /api/v1/super-admin/login, etc.
router.use("/", authRoutes);

// Super Admin Dashboard Features
// Endpoints: /api/v1/super-admin/stats, etc.
router.use("/", dashboardRoutes);

module.exports = router;

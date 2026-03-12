const express = require("express");
const router = express.Router();

const authRoutes = require("./auth.routes");
const profileRoutes = require("./profile.routes");

// Employer Authentication
// Endpoints: /api/v1/employer/signup, /api/v1/employer/login, etc.
router.use("/", authRoutes);

// Employer Profile Features
// Endpoints: /api/v1/employer/profile, etc.
router.use("/", profileRoutes);

module.exports = router;

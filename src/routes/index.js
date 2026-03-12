const express = require("express");
const router = express.Router();

const authRoutes = require("./auth.routes");
const adminRoutes = require("./admin.routes");
const employerRoutes = require("./employer.routes");
const testRoutes = require("./test.routes");

router.use("/auth", authRoutes);
router.use("/admin", adminRoutes);
router.use("/employer", employerRoutes);
router.use("/test", testRoutes);

module.exports = router;

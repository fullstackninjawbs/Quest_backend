const express = require("express");
const router = express.Router();

const authRoutes = require("./auth.routes");
const userRoutes = require("./user.routes");
const testRoutes = require("./test.routes");

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/test", testRoutes);

module.exports = router;

const express = require("express");
const router = express.Router();
const {
    getEmployerProfile,
    updateEmployerProfile,
} = require("../controllers/employer.controller");
const protect = require("../middleware/auth.middleware");
const restrictTo = require("../middleware/role.middleware");

// Protect all routes
router.use(protect);
router.use(restrictTo("employer"));

router.get("/profile", getEmployerProfile);
router.patch("/profile", updateEmployerProfile);

module.exports = router;

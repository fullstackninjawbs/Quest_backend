const express = require("express");
const router = express.Router();
const {
    getEmployerProfile,
    updateEmployerProfile
} = require("../controllers/profile.controller");
const employerAuth = require("../middleware/employer.middleware");

// Protect all routes
router.use(employerAuth);

router.get("/employer-profile", getEmployerProfile);
router.patch("/employer-profile", updateEmployerProfile);

module.exports = router;

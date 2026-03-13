const express = require("express");
const router = express.Router();
const {
    getEmployerProfile,
    updateEmployerProfile,
    deleteOwnProfile
} = require("../controllers/profile.controller");
const employerAuth = require("../middleware/employer.middleware");

// Protect all routes
router.use(employerAuth);

router.get("/emp/profile", getEmployerProfile);
router.patch("/emp/profile-edit", updateEmployerProfile);
router.delete("/emp/profile-delete", deleteOwnProfile);

module.exports = router;

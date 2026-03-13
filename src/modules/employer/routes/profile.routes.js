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

router.get("/profile", getEmployerProfile);
router.patch("/profile-edit", updateEmployerProfile);
router.delete("/profile-delete", deleteOwnProfile);

module.exports = router;

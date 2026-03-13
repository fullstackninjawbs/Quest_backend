const express = require("express");
const router = express.Router();
const {
    getEmployerProfile,
    updateEmployerProfile,
    deleteEmployerProfile,
} = require("../controllers/employerManagement.controller");
const superAdminAuth = require("../middleware/superAdmin.middleware");

// Protect all routes below
router.use(superAdminAuth);

router.get("/emp/:id/detail-profile", getEmployerProfile);
router.put("/emp/:id/profile-edit", updateEmployerProfile);
router.delete("/emp/:id/delete", deleteEmployerProfile);

module.exports = router;

import express from "express";
const router = express.Router();
import {
    getEmployerProfile,
    updateEmployerProfile,
    deleteEmployerProfile,
} from "../controllers/employerManagement.controller.js";
import superAdminAuth from "../middleware/superAdmin.middleware.js";

// Protect all routes below
router.use(superAdminAuth);

router.get("/emp/:id/detail-profile", getEmployerProfile);
router.put("/emp/:id/profile-edit", updateEmployerProfile);
router.delete("/emp/:id/delete", deleteEmployerProfile);

export default router;

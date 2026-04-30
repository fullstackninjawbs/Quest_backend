import express from "express";
const router = express.Router();
import {
    getEmployerProfile,
    updateEmployerProfile,
    deleteOwnProfile
} from "../controllers/profile.controller.js";
import employerAuth from "../middleware/employer.middleware.js";

// Protect all routes
router.use(employerAuth);

router.get("/profile", getEmployerProfile);
router.patch("/profile-edit", updateEmployerProfile);
router.delete("/profile-delete", deleteOwnProfile);

export default router;

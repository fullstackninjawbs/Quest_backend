import express from "express";
const router = express.Router();

import authRoutes from "./auth.routes.js";
import profileRoutes from "./profile.routes.js";

// Employer Authentication
// Endpoints: /api/v1/employer/signup, /api/v1/employer/login, etc.
router.use("/", authRoutes);

// Employer Profile Features
// Endpoints: /api/v1/employer/profile, etc.
router.use("/", profileRoutes);

export default router;

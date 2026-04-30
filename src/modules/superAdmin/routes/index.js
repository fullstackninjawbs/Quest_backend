import express from "express";
const router = express.Router();

import authRoutes from "./auth.routes.js";
import dashboardRoutes from "./dashboard.routes.js";
import employerManagementRoutes from "./employerManagement.routes.js";

// Super Admin Authentication
// Endpoints: /api/v1/super-admin/signup, /api/v1/super-admin/login, etc.
router.use("/", authRoutes);

// Super Admin Dashboard Features
// Endpoints: /api/v1/super-admin/stats, etc.
router.use("/", dashboardRoutes);

// Employer Profile Management
// Endpoints: GET/PUT/DELETE /api/v1/super-admin/emp/:id/...
router.use("/", employerManagementRoutes);

export default router;

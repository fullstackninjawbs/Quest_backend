import express from "express";
const router = express.Router();

import authRoutes from "./auth.routes.js";
import profileRoutes from "./profile.routes.js";
import employeeRoutes from "./employee.routes.js";
import configRoutes from "./config.routes.js";

// Employer Authentication
// Endpoints: /api/v1/employer/signup, /api/v1/employer/login, etc.
router.use("/", authRoutes);

// Employer Profile Features
// Endpoints: /api/v1/employer/profile, etc.
router.use("/", profileRoutes);

// Employee Management
// Endpoints: /api/v1/employer/employee/add, /api/v1/employer/employee/add-csv, etc.
router.use("/employee", employeeRoutes);

// Test Configuration Retrieval
// Endpoints: /api/v1/employer/config/options, /api/v1/employer/config/panels
router.use("/config", configRoutes);

export default router;

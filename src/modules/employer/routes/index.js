import express from "express";
const router = express.Router();

import authRoutes from "./auth.routes.js";
import profileRoutes from "./profile.routes.js";
import employeeRoutes from "./employee.routes.js";
import configRoutes from "./config.routes.js";
import paymentRoutes from "./paymentRoutes.js";
import savedPaymentRoutes from "./savedPaymentRoutes.js";
import orderRoutes from "./order.routes.js";
import securityRoutes from "./security.routes.js";
import resultRoutes from "./result.routes.js";

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

// Stripe Payments
// Endpoints: /api/v1/employer/payment/create-payment-intent
router.use("/payment", paymentRoutes);

// Stripe Saved Payment Methods
// Endpoints: /api/v1/employer/payment-methods/...
router.use("/payment-methods", savedPaymentRoutes);
// Test Orders Flow Endpoints
router.use("/orders", orderRoutes);

// Employer Security Settings Endpoints
router.use("/security", securityRoutes);

// Results & Reports Endpoints
router.use("/results", resultRoutes);

export default router;


import express from "express";
import { getAuditLogs } from "../controllers/auditLog.controller.js";
import employerAuth from "../middleware/employer.middleware.js";

const router = express.Router();

// Enforce Employer Authentication
router.use(employerAuth);

router.get("/", getAuditLogs);

export default router;

import express from "express";
import {
    getSecurityOverview,
    updateSecuritySettings,
    revokeSession,
    revokeOtherSessions
} from "../controllers/security.controller.js";
import employerAuth from "../middleware/employer.middleware.js";

const router = express.Router();

// Enforce Employer Authentication
router.use(employerAuth);

router.get("/", getSecurityOverview);
router.post("/settings", updateSecuritySettings);
router.delete("/sessions/others", revokeOtherSessions);
router.delete("/sessions/:id", revokeSession);

export default router;

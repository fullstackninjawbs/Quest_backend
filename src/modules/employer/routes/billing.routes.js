import express from "express";
import { createCheckoutSession } from "../controllers/billing.controller.js";
import employerAuth from "../middleware/employer.middleware.js";

const router = express.Router();

// All billing routes require Employer Authentication
router.use(employerAuth);

router.post("/create-checkout-session", createCheckoutSession);

export default router;

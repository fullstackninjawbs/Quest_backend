import express from "express";
import { createPaymentIntent } from "../controllers/paymentController.js";
import employerAuth from "../middleware/employer.middleware.js";

const router = express.Router();

// Apply employer authorization to all payment routes
router.use(employerAuth);

router.post("/create-payment-intent", createPaymentIntent);

export default router;
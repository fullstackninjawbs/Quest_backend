import express from "express";
import {
    createStripeCustomer,
    savePaymentMethod,
    getSavedPaymentMethods,
    setDefaultPaymentMethod,
    deletePaymentMethod,
    getPaymentHistory
} from "../controllers/savedPaymentController.js";
import employerAuth from "../middleware/employer.middleware.js";

const router = express.Router();

// All saved payment routes require Employer Authentication
router.use(employerAuth);

router.post("/customer", createStripeCustomer);
router.post("/save-card", savePaymentMethod);
router.get("/saved-cards", getSavedPaymentMethods);
router.post("/default", setDefaultPaymentMethod);
router.delete("/:id", deletePaymentMethod);
router.get("/history", getPaymentHistory);

export default router;

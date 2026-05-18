import express from "express";
import {
    createOrder,
    previewOrder,
    getOrdersList,
    getOrderDetails,
    cancelOrder
} from "../controllers/order.controller.js";
import employerAuth from "../middleware/employer.middleware.js";

const router = express.Router();

// Secure all order routes with Employer Authentication
router.use(employerAuth);

router.post("/create", createOrder);
router.post("/preview", previewOrder);
router.post("/cancel", cancelOrder);
router.get("/", getOrdersList);
router.get("/:id", getOrderDetails);

export default router;

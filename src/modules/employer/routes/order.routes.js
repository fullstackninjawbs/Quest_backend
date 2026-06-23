import express from "express";
import {
    createOrder,
    createBatchOrder,
    previewOrder,
    getOrdersList,
    getOrderDetails,
    cancelOrder,
    deleteOrder,
    getOrderReport
} from "../controllers/order.controller.js";
import employerAuth from "../middleware/employer.middleware.js";

const router = express.Router();

// Secure all order routes with Employer Authentication
router.use(employerAuth);

router.post("/create", createOrder);
router.post("/create-batch", createBatchOrder);
router.post("/preview", previewOrder);
router.post("/cancel", cancelOrder);
router.get("/", getOrdersList);
router.get("/:id", getOrderDetails);
router.get("/:id/report", getOrderReport);
router.delete("/:id", deleteOrder);

export default router;

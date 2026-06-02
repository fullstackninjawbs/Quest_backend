import express from "express";
import {
    createOrder,
    previewOrder,
    getOrdersList,
    getOrderDetails,
    getQuestOrderStatusAPI,
    cancelOrder,
    deleteOrder
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
router.get("/:id/quest-status", getQuestOrderStatusAPI);
router.delete("/:id", deleteOrder);

export default router;

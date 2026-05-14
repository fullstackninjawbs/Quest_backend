import express from "express";
import {
    getTestOptions,
    createTestOption,
    updateTestOption,
    deleteTestOption,
    getTestPanels,
    createTestPanel,
    updateTestPanel,
    deleteTestPanel
} from "../controllers/testConfig.controller.js";
import superAdminAuth from "../middleware/superAdmin.middleware.js";

const router = express.Router();

// Protect all routes below
router.use(superAdminAuth);

// Options routes
router.get("/options", getTestOptions);
router.post("/options", createTestOption);
router.put("/options/:id", updateTestOption);
router.delete("/options/:id", deleteTestOption);

// Panels routes
router.get("/panels", getTestPanels);
router.post("/panels", createTestPanel);
router.put("/panels/:id", updateTestPanel);
router.delete("/panels/:id", deleteTestPanel);

export default router;

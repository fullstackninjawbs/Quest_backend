import express from "express";
import {
    syncAllSites,
    getCollectionSites,
    getSyncStatus
} from "../controllers/collectionSite.controller.js";
import superAdminAuth from "../middleware/superAdmin.middleware.js";

const router = express.Router();

// Protect all routes
router.use(superAdminAuth);

router.post("/sync", syncAllSites);
router.get("/", getCollectionSites);
router.get("/status", getSyncStatus);

export default router;

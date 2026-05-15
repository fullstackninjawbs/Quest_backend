import express from "express";
import { getTestOptions, getTestPanels } from "../../superAdmin/controllers/testConfig.controller.js";
import { getCollectionSites } from "../../superAdmin/controllers/collectionSite.controller.js";
import employerAuth from "../middleware/employer.middleware.js";

const router = express.Router();

// All config routes require Employer Authentication
router.use(employerAuth);

// Expose standard test config options, panels and collection sites to Employers
router.get("/options", getTestOptions);
router.get("/panels", getTestPanels);
router.get("/collection-sites", getCollectionSites);

export default router;

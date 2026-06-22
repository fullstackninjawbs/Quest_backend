import express from "express";
import employerAuth from "../middleware/employer.middleware.js";
import { getResultsList } from "../controllers/result.controller.js";

const router = express.Router();

// All result routes are protected
router.use(employerAuth);

router.route("/").get(getResultsList);

export default router;

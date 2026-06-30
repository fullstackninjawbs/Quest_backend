import express from "express";
import {
    addLocation,
    updateLocation,
    deleteLocation
} from "../controllers/location.controller.js";
import employerAuth from "../middleware/employer.middleware.js";

const router = express.Router();

// Enforce Employer Authentication
router.use(employerAuth);

router.post("/", addLocation);
router.patch("/:locationId", updateLocation);
router.delete("/:locationId", deleteLocation);

export default router;

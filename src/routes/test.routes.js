import express from "express";
const router = express.Router();
import Employer from "../modules/employer/models/employer.model.js";
import catchAsync from "../utils/catchAsync.js";

/**
 * Endpoint for testing DB performance.
 * Performs a simple read and write.
 */
router.get("/db", catchAsync(async (req, res) => {
    // Write
    const tempName = `Test_${Math.random()}`;
    const user = await Employer.create({
        first_name: "Test",
        last_name: "User",
        email: `${tempName}@test.com`,
        phone: "1234567890",
        password: "password123",
        role: "employer",
        isEmailVerified: true
    });

    // Read
    const found = await Employer.findById(user._id);

    // cleanup
    await Employer.findByIdAndDelete(user._id);

    res.status(200).json({ success: true, userId: found._id });
}));

/**
 * Optimized endpoint for testing DB read performance.
 */
router.get("/db-read", catchAsync(async (req, res) => {
    // Just find any user
    const user = await Employer.findOne();
    res.status(200).json({ success: true, userId: user?._id });
}));

export default router;

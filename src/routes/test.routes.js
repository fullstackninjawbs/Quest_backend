const express = require("express");
const router = express.Router();
const User = require("../models/user.model");
const catchAsync = require("../utils/catchAsync");

/**
 * Endpoint for testing DB performance.
 * Performs a simple read and write.
 */
router.get("/db", catchAsync(async (req, res) => {
    // Write
    const tempName = `Test_${Math.random()}`;
    const user = await User.create({
        name: tempName,
        email: `${tempName}@test.com`,
        password: "password123",
        isVerified: true
    });

    // Read
    const found = await User.findById(user._id);

    // cleanup
    await User.findByIdAndDelete(user._id);

    res.status(200).json({ success: true, userId: found._id });
}));

/**
 * Optimized endpoint for testing DB read performance.
 */
router.get("/db-read", catchAsync(async (req, res) => {
    // Just find any user
    const user = await User.findOne();
    res.status(200).json({ success: true, userId: user?._id });
}));

module.exports = router;

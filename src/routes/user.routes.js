const express = require("express");
const router = express.Router();
const {
    getMe,
    updateMe,
    getAllUsers,
    deleteUser,
} = require("../controllers/user.controller");
const protect = require("../middleware/auth.middleware");
const restrictTo = require("../middleware/role.middleware");

router.use(protect); // All routes below require auth

router.get("/me", getMe);
router.patch("/me", updateMe);

// Admin-only routes
router.get("/", restrictTo("admin"), getAllUsers);
router.delete("/:id", restrictTo("admin"), deleteUser);

module.exports = router;

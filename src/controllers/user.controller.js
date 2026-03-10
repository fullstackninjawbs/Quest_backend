const User = require("../models/user.model");
const AppError = require("../utils/AppError");
const catchAsync = require("../utils/catchAsync");

// @desc    Get current user profile
// @route   GET /api/v1/users/me
// @access  Private
exports.getMe = catchAsync(async (req, res, next) => {
    const user = await User.findById(req.user.id);
    if (!user) return next(new AppError("User not found", 404));

    res.status(200).json({ success: true, user });
});

// @desc    Update current user profile
// @route   PATCH /api/v1/users/me
// @access  Private
exports.updateMe = catchAsync(async (req, res, next) => {
    const { name, email } = req.body;

    const updated = await User.findByIdAndUpdate(
        req.user.id,
        { name, email },
        { new: true, runValidators: true }
    );

    res.status(200).json({ success: true, user: updated });
});

// @desc    Get all users (admin)
// @route   GET /api/v1/users
// @access  Admin
exports.getAllUsers = catchAsync(async (req, res) => {
    const users = await User.find();
    res.status(200).json({ success: true, count: users.length, users });
});

// @desc    Delete a user (admin)
// @route   DELETE /api/v1/users/:id
// @access  Admin
exports.deleteUser = catchAsync(async (req, res, next) => {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return next(new AppError("User not found", 404));

    res.status(200).json({ success: true, message: "User deleted successfully" });
});

import Order from "../models/order.model.js";
import catchAsync from "../../../utils/catchAsync.js";

/**
 * @desc    Get results list for currently logged-in employer
 * @route   GET /api/v1/employer/results
 * @access  Private (Employer Only)
 */
export const getResultsList = catchAsync(async (req, res, next) => {
    const { search, page = 1, limit = 1000 } = req.query;

    const baseQuery = { employer_id: req.user._id };

    if (search) {
        baseQuery.$or = [
            { order_number: { $regex: search, $options: "i" } },
            { "employee_snapshot.first_name": { $regex: search, $options: "i" } },
            { "employee_snapshot.last_name": { $regex: search, $options: "i" } },
            { questOrderId: { $regex: search, $options: "i" } }
        ];
    }

    const total = await Order.countDocuments(baseQuery);
    const results = await Order.find(baseQuery)
        .select('-request_payload -response_payload')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit));

    res.status(200).json({
        success: true,
        total,
        page: Number(page),
        limit: Number(limit),
        orders: results // Return as orders array so frontend doesn't break
    });
});

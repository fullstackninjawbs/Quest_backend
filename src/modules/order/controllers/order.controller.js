import catchAsync from '../../../utils/catchAsync.js';
import Order from '../models/order.model.js';
import * as questSoapService from '../../../integrations/quest/soap.service.js';
import AppError from '../../../utils/AppError.js';

/**
 * Submit a new order to Quest
 * POST /api/v1/orders/submit
 */
export const submitOrder = catchAsync(async (req, res, next) => {
    // 1. Create a local 'pending' order to track the attempt
    // Generate a unique reference ID for internal tracking
    const clientReferenceId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

    const order = await Order.create({
        ...req.body,
        clientReferenceId,
        employerId: req.user.id,
        status: 'pending'
    });

    try {
        // 2. Call Quest Integration Service
        const questResult = await questSoapService.callCreateOrder(order);

        // 3. Update order with success data
        order.questResponse = {
            questOrderId: questResult.questOrderId,
            referenceTestId: questResult.referenceTestId,
            rawXmlResponse: questResult.rawXmlResponse,
            parsedResponse: questResult.parsedResponse
        };
        order.status = 'created';
        order.auditTrail.push({
            action: 'order_created',
            status: 'created',
            note: `Successfully integrated with Quest. QuestOrderID: ${questResult.questOrderId}`
        });

        await order.save();

        // 4. Return success to frontend
        res.status(201).json({
            success: true,
            data: {
                orderId: order._id,
                questOrderId: order.questResponse.questOrderId,
                referenceTestId: order.questResponse.referenceTestId,
                status: order.status,
                message: 'Order created successfully with Quest Diagnostics.'
            }
        });

    } catch (error) {
        // Handle failure: Update order status to failed and audit the error
        order.status = 'failed';
        order.auditTrail.push({
            action: 'order_integration_failed',
            status: 'failed',
            note: error.message
        });
        
        await order.save();

        // Pass error to global error handler
        return next(error);
    }
});

/**
 * Get order details by ID
 * GET /api/v1/orders/:id
 */
export const getOrder = catchAsync(async (req, res, next) => {
    const order = await Order.findOne({
        _id: req.params.id,
        employerId: req.user.id
    });

    if (!order) {
        return next(new AppError('Order not found', 404));
    }

    res.status(200).json({
        success: true,
        data: order
    });
});

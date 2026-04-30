import express from 'express';
import * as orderController from '../controllers/order.controller.js';
import * as sitesController from '../controllers/sites.controller.js';
import employerAuth from '../../employer/middleware/employer.middleware.js';
import validate from '../../../shared/middleware/validate.middleware.js';
import { submitOrderSchema } from '../validators/order.validator.js';

const router = express.Router();

/**
 * All order routes require Employer authentication
 */
router.use(employerAuth);

/**
 * Submit a new order
 * POST /api/v1/orders/submit
 */
router.post('/submit', validate(submitOrderSchema), orderController.submitOrder);

/**
 * Get available collection sites
 * GET /api/v1/orders/sites
 */
router.get('/sites', sitesController.getSites);

/**
 * Get order details
 * GET /api/v1/orders/:id
 */
router.get('/:id', orderController.getOrder);

export default router;

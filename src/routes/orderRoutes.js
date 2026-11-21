const express = require('express');
const {
  createOrder,
  getOrderById,
  listOrders,
  updateOrderStatus,
  cancelOrder,
} = require('../controllers/orderController');
const {
  validateObjectId,
  validateCreateOrder,
  validateStatusQuery,
  validateStatusUpdate,
} = require('../middleware/validateOrder');

const router = express.Router();

/**
 * @swagger
 * /orders:
 *   post:
 *     summary: Create a new order
 *     tags: [Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customerId
 *               - items
 *             properties:
 *               customerId:
 *                 type: string
 *                 example: cust_101
 *               items:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   required:
 *                     - productId
 *                     - quantity
 *                     - price
 *                   properties:
 *                     productId: { type: string, example: prod_1 }
 *                     name: { type: string, example: Wireless Mouse }
 *                     quantity: { type: integer, minimum: 1, example: 2 }
 *                     price: { type: number, minimum: 0, example: 799 }
 *     responses:
 *       201:
 *         description: Order created
 *       400:
 *         description: Validation error
 *   get:
 *     summary: List all orders with optional filter and pagination
 *     tags: [Orders]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, PROCESSING, SHIPPED, DELIVERED, CANCELLED]
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: List of orders
 *       400:
 *         description: Invalid query
 */

router.route('/').post(validateCreateOrder, createOrder).get(validateStatusQuery, listOrders);

/**
 * @swagger
 * /orders/{id}:
 *   get:
 *     summary: Get order by ID
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Order details
 *       400:
 *         description: Invalid order ID format
 *       404:
 *         description: Order not found
 */

/**
 * @swagger
 * /orders/{id}/status:
 *   patch:
 *     summary: Update order status
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: Order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [PENDING, PROCESSING, SHIPPED, DELIVERED, CANCELLED]
 *                 example: SHIPPED
 *     responses:
 *       200:
 *         description: Order status updated
 *       400:
 *         description: Invalid status or transition
 *       404:
 *         description: Order not found
 */

/**
 * @swagger
 * /orders/{id}/cancel:
 *   patch:
 *     summary: Cancel an order (only when PENDING)
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Order cancelled
 *       400:
 *         description: Order cannot be cancelled
 *       404:
 *         description: Order not found
 */
router.get('/:id', validateObjectId, getOrderById);
router.patch('/:id/status', validateObjectId, validateStatusUpdate, updateOrderStatus);
router.patch('/:id/cancel', validateObjectId, cancelOrder);
router.get('/:id', validateObjectId, getOrderById);
router.patch('/:id/status', validateObjectId, validateStatusUpdate, updateOrderStatus);
router.patch('/:id/cancel', validateObjectId, cancelOrder);

module.exports = router;

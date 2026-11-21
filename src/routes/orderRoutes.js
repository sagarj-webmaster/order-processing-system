const express = require('express');
const {
  createOrder,
  getOrderById,
  listOrders,
  updateOrderStatus,
  cancelOrder
} = require('../controllers/orderController');
const {
  validateObjectId,
  validateCreateOrder,
  validateStatusQuery,
  validateStatusUpdate
} = require('../middleware/validateOrder');

const router = express.Router();

router
  .route('/')
  .post(validateCreateOrder, createOrder)
  .get(validateStatusQuery, listOrders);

router.get('/:id', validateObjectId, getOrderById);
router.patch('/:id/status', validateObjectId, validateStatusUpdate, updateOrderStatus);
router.patch('/:id/cancel', validateObjectId, cancelOrder);

module.exports = router;

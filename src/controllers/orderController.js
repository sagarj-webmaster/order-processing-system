const { Order } = require('../models/Order');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

// Allowed manual status transitions (excluding CANCELLED which uses dedicated endpoint)
const VALID_TRANSITIONS = {
  PENDING: ['PROCESSING'],
  PROCESSING: ['SHIPPED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: []
};

/**
 * @desc    Create a new order
 * @route   POST /api/orders
 */
const createOrder = asyncHandler(async (req, res) => {
  const { customerId, items } = req.body;

  // Calculate totalAmount securely on the server side (rounded to 2 decimal places)
  const totalAmount = Number(
    items.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)
  );

  const order = await Order.create({
    customerId: customerId.trim(),
    items,
    totalAmount,
    status: 'PENDING'
  });

  res.status(201).json({
    success: true,
    data: order
  });
});

/**
 * @desc    Retrieve order details by ID
 * @route   GET /api/orders/:id
 */
const getOrderById = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(new AppError(`Order not found with ID: ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: order
  });
});

/**
 * @desc    List all orders (optionally filtered by status, with pagination)
 * @route   GET /api/orders
 */
const listOrders = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
  const skip = (page - 1) * limit;

  const filter = {};
  if (status) {
    filter.status = status;
  }

  const [orders, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Order.countDocuments(filter)
  ]);

  res.status(200).json({
    success: true,
    count: orders.length,
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit),
      limit
    },
    data: orders
  });
});

/**
 * @desc    Update order status (e.g., PROCESSING -> SHIPPED -> DELIVERED)
 * @route   PATCH /api/orders/:id/status
 */
const updateOrderStatus = asyncHandler(async (req, res, next) => {
  const { status: nextStatus } = req.body;
  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(new AppError(`Order not found with ID: ${req.params.id}`, 404));
  }

  if (order.status === nextStatus) {
    return next(new AppError(`Order is already in ${nextStatus} status`, 400));
  }

  const allowedNext = VALID_TRANSITIONS[order.status] || [];
  if (!allowedNext.includes(nextStatus)) {
    return next(
      new AppError(
        `Cannot transition order status from ${order.status} to ${nextStatus}`,
        400
      )
    );
  }

  order.status = nextStatus;
  await order.save();

  res.status(200).json({
    success: true,
    data: order
  });
});

/**
 * @desc    Cancel an order (only allowed when status is PENDING)
 * @route   PATCH /api/orders/:id/cancel
 */
const cancelOrder = asyncHandler(async (req, res, next) => {
  // Atomic conditional update prevents race conditions if background job runs simultaneously
  const updatedOrder = await Order.findOneAndUpdate(
    { _id: req.params.id, status: 'PENDING' },
    { $set: { status: 'CANCELLED' } },
    { new: true, runValidators: true }
  );

  if (updatedOrder) {
    return res.status(200).json({
      success: true,
      message: 'Order cancelled successfully',
      data: updatedOrder
    });
  }

  // Determine whether the order doesn't exist or isn't in PENDING state
  const existingOrder = await Order.findById(req.params.id);
  if (!existingOrder) {
    return next(new AppError(`Order not found with ID: ${req.params.id}`, 404));
  }

  return next(
    new AppError(
      `Order cannot be cancelled because its current status is '${existingOrder.status}'. Only PENDING orders can be cancelled.`,
      400
    )
  );
});

module.exports = {
  createOrder,
  getOrderById,
  listOrders,
  updateOrderStatus,
  cancelOrder
};

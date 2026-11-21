const mongoose = require('mongoose');
const AppError = require('../utils/AppError');
const { ORDER_STATUSES } = require('../models/Order');

const validateObjectId = (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return next(new AppError(`Invalid Order ID format: ${req.params.id}`, 400));
  }
  next();
};

const validateCreateOrder = (req, res, next) => {
  const { customerId, items } = req.body;

  if (!customerId || typeof customerId !== 'string' || !customerId.trim()) {
    return next(new AppError('customerId is required and must be a non-empty string', 400));
  }

  if (!Array.isArray(items) || items.length === 0) {
    return next(new AppError('items must be a non-empty array', 400));
  }

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (!item || typeof item !== 'object') {
      return next(new AppError(`Item at index ${i} must be an object`, 400));
    }
    if (!item.productId || typeof item.productId !== 'string' || !item.productId.trim()) {
      return next(new AppError(`Item at index ${i} is missing a valid productId`, 400));
    }
    if (
      typeof item.quantity !== 'number' ||
      !Number.isInteger(item.quantity) ||
      item.quantity < 1
    ) {
      return next(new AppError(`Item at index ${i} must have an integer quantity >= 1`, 400));
    }
    if (typeof item.price !== 'number' || Number.isNaN(item.price) || item.price < 0) {
      return next(new AppError(`Item at index ${i} must have a valid price >= 0`, 400));
    }
  }

  next();
};

const validateStatusQuery = (req, res, next) => {
  const { status } = req.query;
  if (status !== undefined) {
    const normalized = String(status).toUpperCase();
    if (!ORDER_STATUSES.includes(normalized)) {
      return next(
        new AppError(
          `Invalid status filter '${status}'. Allowed values: ${ORDER_STATUSES.join(', ')}`,
          400
        )
      );
    }
    req.query.status = normalized;
  }
  next();
};

const validateStatusUpdate = (req, res, next) => {
  const { status } = req.body;
  if (!status || typeof status !== 'string') {
    return next(new AppError('status is required in request body', 400));
  }
  const normalized = status.toUpperCase();
  if (!ORDER_STATUSES.includes(normalized)) {
    return next(
      new AppError(`Invalid status '${status}'. Allowed values: ${ORDER_STATUSES.join(', ')}`, 400)
    );
  }
  req.body.status = normalized;
  next();
};

module.exports = {
  validateObjectId,
  validateCreateOrder,
  validateStatusQuery,
  validateStatusUpdate,
};

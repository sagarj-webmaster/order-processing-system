const AppError = require('../utils/AppError');

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Validation failed: ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  const value = err.keyValue ? JSON.stringify(err.keyValue) : 'duplicate field';
  const message = `Duplicate field value: ${value}`;
  return new AppError(message, 409);
};

const handleSyntaxError = () => {
  return new AppError('Malformed JSON payload in request body', 400);
};

const notFoundHandler = (req, res, next) => {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
};

const globalErrorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.statusCode = err.statusCode || 500;
  error.status = err.status || 'error';

  if (err.name === 'CastError') {
    error = handleCastErrorDB(err);
  }
  if (err.name === 'ValidationError') {
    error = handleValidationErrorDB(err);
  }
  if (err.code === 11000) {
    error = handleDuplicateFieldsDB(err);
  }
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    error = handleSyntaxError();
  }

  const response = {
    success: false,
    status: error.status,
    message: error.isOperational ? error.message : 'Internal Server Error',
  };

  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  if (!error.isOperational) {
    console.error('UNEXPECTED ERROR:', err);
  }

  res.status(error.statusCode).json(response);
};

module.exports = {
  notFoundHandler,
  globalErrorHandler,
};

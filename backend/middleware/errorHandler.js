const { error } = require('../utils/apiResponse');

/**
 * Global error handling middleware
 * Must be the LAST middleware registered in server.js
 */
const errorHandler = (err, req, res, next) => {
  console.error(`❌ [${req.method}] ${req.originalUrl} →`, err.stack || err.message);

  // Mongoose: document not found
  if (err.name === 'CastError') {
    return error(res, 'Resource not found (invalid ID)', 404);
  }

  // Mongoose: duplicate key (e.g. email already exists)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return error(res, `${field} already exists`, 400);
  }

  // Mongoose: validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return error(res, messages.join('. '), 400);
  }

  // JWT: invalid or expired
  if (err.name === 'JsonWebTokenError') {
    return error(res, 'Invalid token', 401);
  }
  if (err.name === 'TokenExpiredError') {
    return error(res, 'Token expired', 401);
  }

  // Multer: file too large
  if (err.code === 'LIMIT_FILE_SIZE') {
    return error(res, 'File size exceeds 5MB limit', 400);
  }

  // Default server error (hide internals in production)
  const statusCode = err.statusCode || 500;
  const message =
    process.env.NODE_ENV === 'production' && statusCode === 500
      ? 'Internal server error'
      : err.message || 'Internal server error';

  return error(res, message, statusCode);
};

/**
 * 404 handler — place before errorHandler
 */
const notFoundHandler = (req, res, next) => {
  const err = new Error(`Route not found: ${req.originalUrl}`);
  err.statusCode = 404;
  next(err);
};

module.exports = { errorHandler, notFoundHandler };

import { logger } from '../utils/logger.js';

/**
 * 404 handler for unmatched API routes
 */
export const notFoundHandler = (req, res, next) => {
  // Only handle JSON responses for unmatched /api routes
  if (req.originalUrl.startsWith('/api')) {
    return res.status(404).json({
      success: false,
      message: `Resource not found: ${req.method} ${req.originalUrl}`,
    });
  }
  next();
};

/**
 * Centralized Error Handling Middleware for Express
 */
export const errorHandler = (err, req, res, next) => {
  const isProduction = process.env.NODE_ENV === 'production';

  // Safe logging
  logger.error(err.message || 'Unhandled error occurred', err, req);

  let statusCode = err.status || err.statusCode || 500;
  let message = err.message || 'Something went wrong. Please try again later.';

  // 1. Mongoose Bad ObjectId / CastError
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ID format for ${err.path || 'resource'}.`;
  }

  // 2. Mongoose Validation Error
  else if (err.name === 'ValidationError') {
    statusCode = 400;
    const errors = Object.values(err.errors || {}).map((e) => e.message);
    message = errors.length > 0 ? errors.join(', ') : 'Validation failed. Please check your input.';
  }

  // 3. MongoDB Duplicate Key Error (E11000)
  else if (err.code === 11000) {
    statusCode = 409;
    const field = err.keyValue ? Object.keys(err.keyValue)[0] : 'field';
    const fieldFormatted = field.charAt(0).toUpperCase() + field.slice(1);
    message = `An entry with this ${fieldFormatted} already exists.`;
  }

  // 4. JWT Errors
  else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token. Please log in again.';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Your session has expired. Please log in again.';
  }

  // 5. Multer / File Upload Errors
  else if (err.name === 'MulterError' || err.message?.includes('image files are allowed')) {
    statusCode = 400;
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'Uploaded file is too large. Maximum allowed size is 5MB.';
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE' && err.message) {
      message = err.message;
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      message = 'Too many files uploaded or unexpected file field.';
    } else {
      message = err.message || `File upload error: ${err.code}`;
    }
  }

  // 6. Common HTTP / Custom Status Normalization
  if (statusCode === 401 && (!message || message === 'Internal Server Error')) {
    message = 'Please login to continue.';
  } else if (statusCode === 403 && (!message || message === 'Internal Server Error')) {
    message = 'You do not have permission to perform this action.';
  } else if (statusCode === 404 && (!message || message === 'Internal Server Error')) {
    message = 'The requested resource was not found.';
  } else if (statusCode >= 500 && isProduction) {
    message = 'Something went wrong on our servers. Please try again later.';
  }

  // Prevent sending internal database/library trace details in production
  const responsePayload = {
    success: false,
    message,
  };

  if (!isProduction && err.stack) {
    responsePayload.stack = err.stack;
  }

  res.status(statusCode).json(responsePayload);
};

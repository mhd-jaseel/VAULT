import { body, param, query } from 'express-validator';
import mongoose from 'mongoose';

/**
 * Validates a MongoDB ObjectId param
 */
export const validateObjectId = (paramName = 'id') => {
  return param(paramName)
    .trim()
    .notEmpty()
    .withMessage(`Parameter ${paramName} is required.`)
    .custom((val) => mongoose.Types.ObjectId.isValid(val))
    .withMessage(`Invalid ${paramName} format.`);
};

/**
 * Validates admin orders search, filter and sort query parameters
 */
export const validateOrderFilterQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer.')
    .toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100.')
    .toInt(),
  query('search')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Search query cannot exceed 100 characters.'),
  query('status')
    .optional()
    .trim()
    .isIn(['all', 'pending', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled'])
    .withMessage('Invalid order status filter.'),
  query('paymentStatus')
    .optional()
    .trim()
    .isIn(['all', 'pending', 'verified', 'captured', 'SUCCESS', 'cod_pending', 'COD_PENDING', 'failed', 'refunded'])
    .withMessage('Invalid payment status filter.'),
  query('sort')
    .optional()
    .trim()
    .isIn(['newest', 'oldest', 'highest_amount', 'lowest_amount', 'recently_updated', 'customer_asc', 'customer_desc'])
    .withMessage('Invalid sort parameter.'),
  query('dateRange')
    .optional()
    .trim()
    .isIn(['all', 'today', 'this_week', 'this_month', 'custom'])
    .withMessage('Invalid date range option.'),
  query('startDate')
    .optional({ checkFalsy: true })
    .isISO8601()
    .withMessage('Invalid start date format (ISO 8601 required).'),
  query('endDate')
    .optional({ checkFalsy: true })
    .isISO8601()
    .withMessage('Invalid end date format (ISO 8601 required).'),
  query('amountRange')
    .optional()
    .trim()
    .isIn(['all', 'under_1000', '1000_5000', '5000_10000', 'above_10000'])
    .withMessage('Invalid amount range filter.'),
];

export const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer starting from 1.')
    .toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100.')
    .toInt(),
  query('search')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Search query cannot exceed 100 characters.')
    .escape(),
];


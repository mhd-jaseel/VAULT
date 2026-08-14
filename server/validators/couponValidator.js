import { body } from 'express-validator';

export const validateCreateCoupon = [
  body('code')
    .trim()
    .notEmpty()
    .withMessage('Coupon code is required.')
    .isLength({ min: 3, max: 25 })
    .withMessage('Coupon code must be between 3 and 25 characters.')
    .toUpperCase(),
  body('discountType')
    .isIn(['PERCENTAGE', 'FIXED'])
    .withMessage('Discount type must be either PERCENTAGE or FIXED.'),
  body('discountValue')
    .isFloat({ min: 1 })
    .withMessage('Discount value must be a positive number.'),
  body('minOrderAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum order amount cannot be negative.'),
  body('expiryDate')
    .notEmpty()
    .withMessage('Expiry date is required.')
    .isISO8601()
    .withMessage('Invalid date format for expiry date.'),
];

export const validateApplyCoupon = [
  body('code')
    .trim()
    .notEmpty()
    .withMessage('Please enter a coupon code.')
    .isLength({ min: 2, max: 30 })
    .withMessage('Invalid coupon code format.')
    .toUpperCase(),
  body('subtotal')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Subtotal cannot be negative.'),
];

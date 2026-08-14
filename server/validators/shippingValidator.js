import { body } from 'express-validator';

export const validateCalculateShipping = [
  body('orderAmount')
    .notEmpty()
    .withMessage('Order amount is required.')
    .isFloat({ min: 0 })
    .withMessage('Order amount cannot be negative.'),
];

export const validateUpdateShippingSettings = [
  body('freeShippingMinAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Free delivery minimum amount cannot be negative.'),
  body('shippingCharges')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Shipping charge cannot be negative.'),
];

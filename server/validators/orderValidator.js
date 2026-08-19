import { body, param } from 'express-validator';
import mongoose from 'mongoose';

export const validateCreateOrder = [
  body('orderItems')
    .isArray({ min: 1 })
    .withMessage('Order must contain at least one item.'),
  body('orderItems.*.product')
    .custom((val) => mongoose.Types.ObjectId.isValid(val))
    .withMessage('Invalid Product ID in order items.'),
  body('orderItems.*.qty')
    .isInt({ min: 1, max: 100 })
    .withMessage('Item quantity must be between 1 and 100.'),
  body('shippingAddress')
    .isObject()
    .withMessage('Shipping address is required.'),
  body('shippingAddress.street')
    .trim()
    .notEmpty()
    .withMessage('Street address is required.')
    .isLength({ max: 150 })
    .withMessage('Street address cannot exceed 150 characters.'),
  body('shippingAddress.city')
    .trim()
    .notEmpty()
    .withMessage('City is required.')
    .isLength({ max: 80 })
    .withMessage('City cannot exceed 80 characters.'),
  body('shippingAddress.state')
    .trim()
    .notEmpty()
    .withMessage('State is required.')
    .isLength({ max: 80 })
    .withMessage('State cannot exceed 80 characters.'),
  body('shippingAddress.zip')
    .trim()
    .notEmpty()
    .withMessage('PIN code is required.')
    .matches(/^[1-9][0-9]{5}$/)
    .withMessage('Please enter a valid 6-digit PIN code.'),
  body('shippingAddress.phone')
    .trim()
    .notEmpty()
    .withMessage('Recipient phone number is required.')
    .customSanitizer((val) => (typeof val === 'string' ? val.replace(/[\s\-()]/g, '') : val))
    .matches(/^(?:(?:\+|0{0,2})91(\s*[-]\s*)?|[0]?)?[6789]\d{9}$/)
    .withMessage('Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9.'),
  body('paymentMethod')
    .trim()
    .notEmpty()
    .isIn(['COD', 'ONLINE', 'WALLET', 'CARD', 'UPI', 'NETBANKING'])
    .withMessage('Invalid payment method selected.'),
];

export const validateUpdateOrderStatus = [
  param('id')
    .custom((val) => mongoose.Types.ObjectId.isValid(val))
    .withMessage('Invalid Order ID.'),
  body('status')
    .trim()
    .notEmpty()
    .withMessage('Status is required.')
    .customSanitizer((val) => (typeof val === 'string' ? val.toLowerCase().trim() : val))
    .isIn(['pending', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled'])
    .withMessage('Invalid order status.'),
];

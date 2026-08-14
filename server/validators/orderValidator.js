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
    .withMessage('Postal / ZIP Code is required.')
    .matches(/^[0-9A-Za-z -]{3,10}$/)
    .withMessage('Invalid ZIP code format.'),
  body('shippingAddress.phone')
    .trim()
    .notEmpty()
    .withMessage('Recipient phone number is required.')
    .matches(/^(\+?\d{1,4}[- ]?)?\d{10}$/)
    .withMessage('Please enter a valid 10-digit phone number.'),
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
    .isIn(['PLACED', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED'])
    .withMessage('Invalid order status.'),
];

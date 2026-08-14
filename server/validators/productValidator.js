import { body, param, query } from 'express-validator';
import mongoose from 'mongoose';

export const validateCreateProduct = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Product name is required.')
    .isLength({ min: 2, max: 120 })
    .withMessage('Product name must be between 2 and 120 characters.'),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Product description is required.')
    .isLength({ max: 2000 })
    .withMessage('Product description cannot exceed 2000 characters.'),
  body('price')
    .notEmpty()
    .withMessage('Price is required.')
    .isFloat({ min: 0.01, max: 10000000 })
    .withMessage('Price must be a positive number greater than 0.'),
  body('category')
    .trim()
    .notEmpty()
    .withMessage('Category is required.')
    .custom((val) => mongoose.Types.ObjectId.isValid(val))
    .withMessage('Invalid Category ID.'),
  body('brand')
    .optional({ checkFalsy: true })
    .trim()
    .custom((val) => !val || mongoose.Types.ObjectId.isValid(val))
    .withMessage('Invalid Brand ID.'),
  body('countInStock')
    .notEmpty()
    .withMessage('Stock quantity is required.')
    .isInt({ min: 0, max: 100000 })
    .withMessage('Stock must be an integer between 0 and 100,000.'),
  body('discount')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Discount percentage must be between 0 and 100.'),
];

export const validateUpdateProduct = [
  param('id')
    .custom((val) => mongoose.Types.ObjectId.isValid(val))
    .withMessage('Invalid Product ID.'),
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Product name cannot be empty.')
    .isLength({ min: 2, max: 120 })
    .withMessage('Product name must be between 2 and 120 characters.'),
  body('price')
    .optional()
    .isFloat({ min: 0.01, max: 10000000 })
    .withMessage('Price must be a positive number greater than 0.'),
  body('countInStock')
    .optional()
    .isInt({ min: 0, max: 100000 })
    .withMessage('Stock must be an integer between 0 and 100,000.'),
  body('discount')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Discount percentage must be between 0 and 100.'),
];

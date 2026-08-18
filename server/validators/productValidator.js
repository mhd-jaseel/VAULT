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
  body(['brand', 'brandId'])
    .custom((val, { req }) => {
      const brandVal = req.body.brand || req.body.brandId;
      if (!brandVal || !String(brandVal).trim()) {
        throw new Error('Brand is required.');
      }
      if (!mongoose.Types.ObjectId.isValid(brandVal)) {
        throw new Error('Invalid Brand ID.');
      }
      return true;
    }),
  body(['stock', 'stockQty', 'countInStock'])
    .custom((val, { req }) => {
      const stockVal = req.body.stock !== undefined ? req.body.stock : (req.body.stockQty !== undefined ? req.body.stockQty : req.body.countInStock);
      if (stockVal === undefined || stockVal === null || String(stockVal).trim() === '') {
        throw new Error('Stock quantity is required.');
      }
      const num = Number(stockVal);
      if (!Number.isFinite(num) || !Number.isInteger(num) || num < 0 || num > 100000) {
        throw new Error('Stock quantity must be a valid non-negative number.');
      }
      return true;
    }),
  body('discountType')
    .optional({ nullable: true, checkFalsy: true })
    .isIn(['percentage', 'fixed'])
    .withMessage('Discount type must be either percentage or fixed.'),
  body('discountValue')
    .optional({ nullable: true, checkFalsy: true })
    .isFloat({ min: 0 })
    .withMessage('Discount value must be a non-negative number.'),
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
  body('description')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Product description cannot be empty.')
    .isLength({ max: 2000 })
    .withMessage('Product description cannot exceed 2000 characters.'),
  body('price')
    .optional()
    .isFloat({ min: 0.01, max: 10000000 })
    .withMessage('Price must be a positive number greater than 0.'),
  body('category')
    .optional()
    .trim()
    .custom((val) => !val || mongoose.Types.ObjectId.isValid(val))
    .withMessage('Invalid Category ID.'),
  body('brand')
    .optional()
    .trim()
    .custom((val) => !val || mongoose.Types.ObjectId.isValid(val))
    .withMessage('Invalid Brand ID.'),
  body('brandId')
    .optional()
    .trim()
    .custom((val) => !val || mongoose.Types.ObjectId.isValid(val))
    .withMessage('Invalid Brand ID.'),
  body(['stock', 'stockQty', 'countInStock'])
    .optional()
    .custom((val, { req }) => {
      const stockVal = req.body.stock !== undefined ? req.body.stock : (req.body.stockQty !== undefined ? req.body.stockQty : req.body.countInStock);
      if (stockVal !== undefined && stockVal !== null && String(stockVal).trim() !== '') {
        const num = Number(stockVal);
        if (!Number.isFinite(num) || !Number.isInteger(num) || num < 0 || num > 100000) {
          throw new Error('Stock quantity must be a valid non-negative number.');
        }
      }
      return true;
    }),
  body('discountType')
    .optional({ nullable: true, checkFalsy: true })
    .isIn(['percentage', 'fixed'])
    .withMessage('Discount type must be either percentage or fixed.'),
  body('discountValue')
    .optional({ nullable: true, checkFalsy: true })
    .isFloat({ min: 0 })
    .withMessage('Discount value must be a non-negative number.'),
];

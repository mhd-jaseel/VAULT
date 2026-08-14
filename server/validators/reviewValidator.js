import { body, param } from 'express-validator';
import mongoose from 'mongoose';

export const validateCreateReview = [
  body('productId')
    .trim()
    .notEmpty()
    .withMessage('Product ID is required.')
    .custom((val) => mongoose.Types.ObjectId.isValid(val))
    .withMessage('Invalid Product ID.'),
  body('rating')
    .notEmpty()
    .withMessage('Rating is required.')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be an integer between 1 and 5.'),
  body('comment')
    .trim()
    .notEmpty()
    .withMessage('Review comment is required.')
    .isLength({ min: 5, max: 1000 })
    .withMessage('Comment must be between 5 and 1000 characters.'),
  body('title')
    .optional()
    .trim()
    .isLength({ max: 120 })
    .withMessage('Review title cannot exceed 120 characters.'),
];

export const validateUpdateReview = [
  param('reviewId')
    .custom((val) => mongoose.Types.ObjectId.isValid(val))
    .withMessage('Invalid Review ID.'),
  body('rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be an integer between 1 and 5.'),
  body('comment')
    .optional()
    .trim()
    .isLength({ min: 5, max: 1000 })
    .withMessage('Comment must be between 5 and 1000 characters.'),
];

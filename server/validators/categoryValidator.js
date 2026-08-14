import { body } from 'express-validator';

export const validateCreateCategory = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Category name is required.')
    .isLength({ min: 2, max: 60 })
    .withMessage('Category name must be between 2 and 60 characters.'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Category description cannot exceed 500 characters.'),
];

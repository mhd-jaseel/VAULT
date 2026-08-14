import { body } from 'express-validator';

export const validateAdminLogin = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required.')
    .isEmail()
    .withMessage('Please provide a valid email address.')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required.')
    .isLength({ min: 6, max: 100 })
    .withMessage('Password must be at least 6 characters long.'),
];

export const validateGoogleLogin = [
  body('credential')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Google credential is required.'),
  body('token')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Google credential token is required.'),
  body().custom((value, { req }) => {
    if (!req.body.credential && !req.body.token) {
      throw new Error('Google credential is required.');
    }
    return true;
  }),
];

export const validateUpdateProfile = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Name cannot be empty.')
    .isLength({ min: 2, max: 80 })
    .withMessage('Name must be between 2 and 80 characters.'),
  body('phone')
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^(\+?\d{1,4}[- ]?)?\d{10}$/)
    .withMessage('Please enter a valid 10-digit phone number.'),
  body('address')
    .optional()
    .isObject()
    .withMessage('Address must be an object.'),
  body('address.street')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 150 })
    .withMessage('Street address cannot exceed 150 characters.'),
  body('address.city')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 80 })
    .withMessage('City cannot exceed 80 characters.'),
  body('address.state')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 80 })
    .withMessage('State cannot exceed 80 characters.'),
  body('address.zip')
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^[0-9A-Za-z -]{3,10}$/)
    .withMessage('Invalid ZIP / Postal Code format.'),
];

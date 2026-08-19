import { body } from 'express-validator';

export const validateCreateCoupon = [
  body(['couponCode', 'code'])
    .custom((val, { req }) => {
      const code = req.body.couponCode || req.body.code;
      if (!code || !String(code).trim()) {
        throw new Error('Coupon code is required.');
      }
      const trimmed = String(code).trim();
      if (trimmed.length < 3 || trimmed.length > 25) {
        throw new Error('Coupon code must be between 3 and 25 characters.');
      }
      if (!/^[A-Z0-9]+$/i.test(trimmed)) {
        throw new Error('Coupon code can only contain letters and numbers.');
      }
      return true;
    }),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required.')
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters.'),
  body('discountType')
    .trim()
    .toLowerCase()
    .isIn(['percentage', 'fixed'])
    .withMessage('Discount type must be either percentage or fixed.'),
  body('discountValue')
    .notEmpty()
    .withMessage('Discount value is required.')
    .isFloat({ min: 0.01 })
    .withMessage('Discount value must be greater than 0.')
    .custom((val, { req }) => {
      const type = String(req.body.discountType || '').toLowerCase();
      if (type === 'percentage' && Number(val) > 100) {
        throw new Error('Percentage discount cannot exceed 100%.');
      }
      return true;
    }),
  body(['minimumPurchase', 'minOrderAmount'])
    .optional({ nullable: true })
    .isFloat({ min: 0 })
    .withMessage('Minimum order amount cannot be negative.'),
  body('maximumDiscount')
    .optional({ nullable: true, checkFalsy: true })
    .isFloat({ min: 0 })
    .withMessage('Maximum discount cap cannot be negative.'),
  body('startDate')
    .notEmpty()
    .withMessage('Start date is required.')
    .isISO8601()
    .withMessage('Invalid date format for start date.'),
  body('expiryDate')
    .notEmpty()
    .withMessage('Expiry date is required.')
    .isISO8601()
    .withMessage('Invalid date format for expiry date.')
    .custom((val, { req }) => {
      if (req.body.startDate) {
        const start = new Date(req.body.startDate);
        const expiry = new Date(val);
        if (expiry <= start) {
          throw new Error('Expiry date must be after the start date.');
        }
      }
      return true;
    }),
  body('usageLimit')
    .optional({ nullable: true })
    .isInt({ min: 0 })
    .withMessage('Usage limit cannot be negative.'),
  body('userLimit')
    .optional({ nullable: true })
    .isInt({ min: 1 })
    .withMessage('Per-user limit must be at least 1.'),
];

export const validateApplyCoupon = [
  body(['couponCode', 'code'])
    .custom((val, { req }) => {
      const code = req.body.couponCode || req.body.code;
      if (!code || !String(code).trim()) {
        throw new Error('Please enter a coupon code.');
      }
      const trimmed = String(code).trim();
      if (trimmed.length < 2 || trimmed.length > 30) {
        throw new Error('Invalid coupon code format.');
      }
      return true;
    }),
  body('subtotal')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Subtotal cannot be negative.'),
];


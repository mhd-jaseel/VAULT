import { body } from 'express-validator';

export const validateWalletAdjustment = [
  body('amount')
    .exists({ checkFalsy: false })
    .withMessage('Adjustment amount is required.')
    .custom((val) => {
      const num = Number(val);
      if (isNaN(num) || !isFinite(num)) {
        throw new Error('Amount must be a valid numeric number.');
      }
      if (num <= 0) {
        throw new Error('Amount must be greater than zero.');
      }
      if (num > 1000000) {
        throw new Error('Amount exceeds maximum single transaction limit of ₹10,00,000.');
      }
      return true;
    }),
  body('direction')
    .trim()
    .notEmpty()
    .withMessage('Adjustment type (Add Credit or Deduct Amount) is required.')
    .isIn(['CREDIT', 'DEBIT'])
    .withMessage('Adjustment type must be either CREDIT or DEBIT.'),
  body('reason')
    .trim()
    .notEmpty()
    .withMessage('Reason for manual wallet adjustment is mandatory.')
    .isLength({ min: 3, max: 500 })
    .withMessage('Reason must be between 3 and 500 characters long.'),
  body('idempotencyKey')
    .optional()
    .trim()
    .isString()
    .isLength({ max: 100 })
    .withMessage('Invalid idempotency key format.'),
];

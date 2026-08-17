import { body } from 'express-validator';

export const validateCreateCampaign = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Campaign title is required.')
    .isLength({ min: 2, max: 120 })
    .withMessage('Campaign title must be between 2 and 120 characters.'),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Campaign description is required.')
    .isLength({ max: 1000 })
    .withMessage('Campaign description cannot exceed 1000 characters.'),
  body('startDate')
    .optional({ checkFalsy: true })
    .isISO8601()
    .withMessage('Invalid start date format.'),
  body('endDate')
    .optional({ checkFalsy: true })
    .isISO8601()
    .withMessage('Invalid end date format.')
    .custom((val, { req }) => {
      if (val && req.body.startDate) {
        const start = new Date(req.body.startDate);
        const end = new Date(val);
        if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && end < start) {
          throw new Error('End date must be on or after the start date.');
        }
      }
      return true;
    }),
];

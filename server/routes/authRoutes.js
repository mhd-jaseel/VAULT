import express from 'express';
import { body } from 'express-validator';
import {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  forgotPassword,
  getAllCustomers,
  getUserById,
  getUserOrders,
  blockUser,
  unblockUser,
} from '../controllers/auth/index.js';
import { protect, isAdmin } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';

const router = express.Router();

router.post(
  '/register',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Please enter a valid email address'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long'),
    validateRequest,
  ],
  registerUser
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Please enter a valid email address'),
    body('password').notEmpty().withMessage('Password is required'),
    validateRequest,
  ],
  loginUser
);

router.post(
  '/forgot-password',
  [
    body('email').isEmail().withMessage('Please enter a valid email address'),
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('New password must be at least 6 characters long'),
    validateRequest,
  ],
  forgotPassword
);

router
  .route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

// Admin: list all customers (with search/filter/pagination)
router.get('/customers', protect, isAdmin, getAllCustomers);

// Admin: single user detail + stats
router.get('/customers/:id', protect, isAdmin, getUserById);

// Admin: user's order history
router.get('/customers/:id/orders', protect, isAdmin, getUserOrders);

// Admin: block / unblock
router.patch('/customers/:id/block', protect, isAdmin, blockUser);
router.patch('/customers/:id/unblock', protect, isAdmin, unblockUser);

export default router;

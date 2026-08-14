import express from 'express';
import { body } from 'express-validator';
import {
  googleLogin,
  getUserProfile,
  updateUserProfile,
  getAllCustomers,
  getUserById,
  getUserOrders,
  blockUser,
  unblockUser,
  adminLogin,
  logoutUser,
} from '../controllers/auth/index.js';
import { protect, isAdmin, authLimiter } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';

import {
  validateAdminLogin,
  validateGoogleLogin,
  validateUpdateProfile,
} from '../validators/authValidator.js';
import { validateObjectId, validatePagination } from '../validators/commonValidator.js';

const router = express.Router();

// Apply authLimiter to authentication endpoints
router.use('/admin/login', authLimiter);
router.use('/google-login', authLimiter);

router.post('/google-login', validateGoogleLogin, validateRequest, googleLogin);

// Admin Auth
router.post('/admin/login', validateAdminLogin, validateRequest, adminLogin);

// Logout
router.post('/logout', logoutUser);

router
  .route('/profile')
  .get(protect, getUserProfile)
  .put(protect, validateUpdateProfile, validateRequest, updateUserProfile);

// Admin: list all customers (with search/filter/pagination)
router.get('/customers', protect, isAdmin, validatePagination, validateRequest, getAllCustomers);

// Admin: single user detail + stats
router.get('/customers/:id', protect, isAdmin, validateObjectId('id'), validateRequest, getUserById);

// Admin: user's order history
router.get('/customers/:id/orders', protect, isAdmin, validateObjectId('id'), validateRequest, getUserOrders);

// Admin: block / unblock
router.patch('/customers/:id/block', protect, isAdmin, validateObjectId('id'), validateRequest, blockUser);
router.patch('/customers/:id/unblock', protect, isAdmin, validateObjectId('id'), validateRequest, unblockUser);

export default router;

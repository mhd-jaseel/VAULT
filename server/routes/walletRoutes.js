import express from 'express';
import {
  getMyWallet,
  getMyWalletTransactions,
  getAdminWalletTransactions,
  getUserWalletDetails,
  adjustUserWallet,
} from '../controllers/wallet/index.js';
import { protect, isAdmin, isSuperAdmin } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';
import { validateObjectId, validatePagination } from '../validators/commonValidator.js';
import { validateWalletAdjustment } from '../validators/walletValidator.js';

const router = express.Router();

// Customer Wallet
router.get('/', protect, getMyWallet);
router.get('/transactions', protect, getMyWalletTransactions);

// Admin: System-wide financial wallet logs
router.get('/admin/all', protect, isAdmin, getAdminWalletTransactions);

// Admin / Super Admin: Customer Wallet View (Admin or Super Admin)
router.get(
  '/admin/users/:userId',
  protect,
  isAdmin,
  validateObjectId('userId'),
  validatePagination,
  validateRequest,
  getUserWalletDetails
);

// Super Admin ONLY: Adjust Customer Wallet (Strict 403 enforcement for normal admins)
router.post(
  '/admin/users/:userId/adjust',
  protect,
  isSuperAdmin,
  validateObjectId('userId'),
  validateWalletAdjustment,
  validateRequest,
  adjustUserWallet
);

export default router;


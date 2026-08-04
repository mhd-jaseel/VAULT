import express from 'express';
import {
  createDiscount,
  getDiscounts,
  getDiscountById,
  updateDiscount,
  toggleDiscountStatus,
  deleteDiscount
} from '../controllers/discountController.js';
import { protect, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// Admin Routes
router.post('/admin/discounts', protect, isAdmin, createDiscount);
router.get('/admin/discounts', protect, isAdmin, getDiscounts);
router.get('/admin/discounts/:id', protect, isAdmin, getDiscountById);
router.put('/admin/discounts/:id', protect, isAdmin, updateDiscount);
router.patch('/admin/discounts/:id/status', protect, isAdmin, toggleDiscountStatus);
router.delete('/admin/discounts/:id', protect, isAdmin, deleteDiscount);

export default router;

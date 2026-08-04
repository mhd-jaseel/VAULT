import express from 'express';
import {
  createCoupon,
  getCoupons,
  getCouponById,
  updateCoupon,
  toggleCouponStatus,
  deleteCoupon,
  applyCoupon
} from '../controllers/couponController.js';
import { protect, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// Admin Routes
router.post('/admin/coupons', protect, isAdmin, createCoupon);
router.get('/admin/coupons', protect, isAdmin, getCoupons);
router.get('/admin/coupons/:id', protect, isAdmin, getCouponById);
router.put('/admin/coupons/:id', protect, isAdmin, updateCoupon);
router.patch('/admin/coupons/:id/status', protect, isAdmin, toggleCouponStatus);
router.delete('/admin/coupons/:id', protect, isAdmin, deleteCoupon);

// Customer Route
router.post('/coupon/apply', protect, applyCoupon);

export default router;

import express from 'express';
import {
  createCoupon,
  getCoupons,
  getCouponById,
  updateCoupon,
  toggleCouponStatus,
  deleteCoupon,
  applyCoupon
} from '../controllers/coupon/index.js';
import { protect, isAdmin } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';
import { validateObjectId } from '../validators/commonValidator.js';
import { validateCreateCoupon, validateApplyCoupon } from '../validators/couponValidator.js';

const router = express.Router();

// Admin Routes
router.post('/admin/coupons', protect, isAdmin, validateCreateCoupon, validateRequest, createCoupon);
router.get('/admin/coupons', protect, isAdmin, getCoupons);
router.get('/admin/coupons/:id', protect, isAdmin, validateObjectId('id'), validateRequest, getCouponById);
router.put('/admin/coupons/:id', protect, isAdmin, validateObjectId('id'), validateRequest, updateCoupon);
router.patch('/admin/coupons/:id/status', protect, isAdmin, validateObjectId('id'), validateRequest, toggleCouponStatus);
router.delete('/admin/coupons/:id', protect, isAdmin, validateObjectId('id'), validateRequest, deleteCoupon);

// Customer Route
router.post('/coupon/apply', protect, validateApplyCoupon, validateRequest, applyCoupon);

export default router;

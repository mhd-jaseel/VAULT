import express from 'express';
import {
  getPublicShippingSettings,
  calculateShippingQuote,
  getAdminShippingSettings,
  updateAdminShippingSettings,
  createShippingCampaign,
  updateShippingCampaign,
  deleteShippingCampaign,
} from '../controllers/shipping/index.js';
import { protect, isAdmin } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';
import { validateObjectId } from '../validators/commonValidator.js';
import {
  validateCalculateShipping,
  validateUpdateShippingSettings,
} from '../validators/shippingValidator.js';

const router = express.Router();

// Public routes for checkout/cart/storefront
router.get('/', getPublicShippingSettings);
router.post('/calculate', validateCalculateShipping, validateRequest, calculateShippingQuote);

// Admin only routes
router.get('/admin', protect, isAdmin, getAdminShippingSettings);
router.put('/admin', protect, isAdmin, validateUpdateShippingSettings, validateRequest, updateAdminShippingSettings);

router.post('/admin/campaigns', protect, isAdmin, createShippingCampaign);
router.put('/admin/campaigns/:id', protect, isAdmin, validateObjectId('id'), validateRequest, updateShippingCampaign);
router.delete('/admin/campaigns/:id', protect, isAdmin, validateObjectId('id'), validateRequest, deleteShippingCampaign);

export default router;

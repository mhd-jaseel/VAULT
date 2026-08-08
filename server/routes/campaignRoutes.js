import express from 'express';
import {
  getCampaigns,
  getAdminCampaigns,
  createCampaign,
  updateCampaign,
  deleteCampaign,
} from '../controllers/campaignController.js';
import { protect, isAdmin } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

// Public — active campaigns for the home page
router.get('/campaigns', getCampaigns);

const campaignUpload = upload.fields([
  { name: 'desktopImageUrl', maxCount: 1 },
  { name: 'mobileImageUrl', maxCount: 1 },
]);

// Protected Admin routes
router.get('/admin/campaigns', protect, isAdmin, getAdminCampaigns);
router.post('/admin/campaigns', protect, isAdmin, campaignUpload, createCampaign);
router.patch('/admin/campaigns/:id', protect, isAdmin, campaignUpload, updateCampaign);
router.delete('/admin/campaigns/:id', protect, isAdmin, deleteCampaign);

export default router;

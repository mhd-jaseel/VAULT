import express from 'express';
import {
  getHeroBanners,
  getAdminHeroBanners,
  createHeroBanner,
  updateHeroBanner,
  deleteHeroBanner,
} from '../controllers/heroBannerController.js';
import { protect, isAdmin } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

// Public route to fetch active banners
router.get('/hero-banners', getHeroBanners);

const bannerUploadFields = upload.fields([
  { name: 'imageUrl', maxCount: 1 },
  { name: 'mobileImageUrl', maxCount: 1 },
  { name: 'modelImageUrl', maxCount: 1 },
  { name: 'productImageUrl', maxCount: 1 }
]);

// Protected Admin routes
router.get('/admin/hero-banners', protect, isAdmin, getAdminHeroBanners);
router.post('/admin/hero-banners', protect, isAdmin, bannerUploadFields, createHeroBanner);
router.patch('/admin/hero-banners/:id', protect, isAdmin, bannerUploadFields, updateHeroBanner);
router.delete('/admin/hero-banners/:id', protect, isAdmin, deleteHeroBanner);

export default router;

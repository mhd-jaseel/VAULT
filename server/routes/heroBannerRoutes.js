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

// Protected Admin routes
router.get('/admin/hero-banners', protect, isAdmin, getAdminHeroBanners);
router.post('/admin/hero-banners', protect, isAdmin, upload.single('imageUrl'), createHeroBanner);
router.patch('/admin/hero-banners/:id', protect, isAdmin, upload.single('imageUrl'), updateHeroBanner);
router.delete('/admin/hero-banners/:id', protect, isAdmin, deleteHeroBanner);

export default router;

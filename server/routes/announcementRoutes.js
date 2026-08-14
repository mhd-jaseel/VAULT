import express from 'express';
import {
  getPublicAnnouncement,
  getAdminAnnouncement,
  updateAnnouncement,
} from '../controllers/announcement/index.js';
import { protect, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// Public route for customer frontend
router.get('/public', getPublicAnnouncement);

// Admin management routes (protected)
router.get('/admin', protect, isAdmin, getAdminAnnouncement);
router.put('/admin', protect, isAdmin, updateAnnouncement);

// Base GET fallback for convenience
router.get('/', getPublicAnnouncement);

export default router;

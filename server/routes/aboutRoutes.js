import express from 'express';
import {
  getAboutPageContent,
  updateAboutPageContent,
  updateHeroImage,
  updateFounder,
  updateCoFounder,
  addAdditionalSection,
  updateAdditionalSection,
  deleteAdditionalSection,
} from '../controllers/about/index.js';
import { protect, isAdmin } from '../middleware/auth.js';
import upload from '../middleware/upload.js';
import { validateRequest } from '../middleware/validate.js';
import { validateObjectId } from '../validators/commonValidator.js';

const router = express.Router();

// ── Public Routes ─────────────────────────────────────────────────────────────
router.get('/', getAboutPageContent);

// ── Admin Protected Routes ───────────────────────────────────────────────────
router.put('/admin', protect, isAdmin, updateAboutPageContent);
router.put('/admin/hero', protect, isAdmin, upload.single('image'), updateHeroImage);
router.put('/admin/founder', protect, isAdmin, upload.single('image'), updateFounder);
router.put('/admin/co-founder', protect, isAdmin, upload.single('image'), updateCoFounder);

router.post('/admin/sections', protect, isAdmin, upload.single('image'), addAdditionalSection);
router.put('/admin/sections/:sectionId', protect, isAdmin, upload.single('image'), validateObjectId('sectionId'), validateRequest, updateAdditionalSection);
router.delete('/admin/sections/:sectionId', protect, isAdmin, validateObjectId('sectionId'), validateRequest, deleteAdditionalSection);

export default router;

import express from 'express';
import { getSettings, updateSettings } from '../controllers/settings/index.js';
import { protect, isAdmin } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

router.get('/', getSettings);
router.put(
  '/',
  protect,
  isAdmin,
  upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'upiQrCode', maxCount: 1 },
    { name: 'heroImage', maxCount: 1 },
  ]),
  updateSettings
);

export default router;

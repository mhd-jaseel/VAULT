import express from 'express';
import {
  createReturnRequest,
  getMyReturns,
  getReturnById,
  getAllReturnsAdmin,
  updateReturnStatusAdmin,
} from '../controllers/return/index.js';
import { protect, isAdmin } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

// ── Customer Routes ────────────────────────────────────────────────────────
router.post('/', protect, upload.array('evidenceImages', 4), createReturnRequest);
router.get('/my-returns', protect, getMyReturns);
router.get('/:id', protect, getReturnById);

// ── Admin Routes ───────────────────────────────────────────────────────────
router.get('/admin/all', protect, isAdmin, getAllReturnsAdmin);
router.patch('/admin/:id/status', protect, isAdmin, updateReturnStatusAdmin);

export default router;

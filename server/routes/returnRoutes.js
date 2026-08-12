import express from 'express';
import {
  createReturnRequest,
  getEligibleReplacementProducts,
  createReplacementPaymentOrder,
  verifyReplacementPayment,
  getMyReturns,
  getReturnById,
  getAllReturnsAdmin,
  updateReturnStatusAdmin,
  processManualRefundAdmin,
  processReplacementShipAdmin,
} from '../controllers/return/index.js';
import { protect, isAdmin } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

// ── Customer Routes ────────────────────────────────────────────────────────
router.post('/', protect, upload.array('evidenceImages', 4), createReturnRequest);
router.get('/my-returns', protect, getMyReturns);
router.get('/eligible-products/:orderId/:productId', protect, getEligibleReplacementProducts);
router.post('/:id/pay-difference', protect, createReplacementPaymentOrder);
router.post('/:id/verify-difference', protect, verifyReplacementPayment);
router.get('/:id', protect, getReturnById);

// ── Admin Routes ───────────────────────────────────────────────────────────
router.get('/admin/all', protect, isAdmin, getAllReturnsAdmin);
router.patch('/admin/:id/status', protect, isAdmin, updateReturnStatusAdmin);
router.patch('/admin/:id/refund', protect, isAdmin, upload.single('proofImage'), processManualRefundAdmin);
router.patch('/admin/:id/replacement-ship', protect, isAdmin, processReplacementShipAdmin);

export default router;

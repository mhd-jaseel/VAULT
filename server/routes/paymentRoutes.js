import express from 'express';
import {
  submitPayment,
  verifyPayment,
  rejectPayment,
  getAllPayments,
} from '../controllers/paymentController.js';
import { protect, isAdmin } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

router
  .route('/')
  .post(protect, upload.single('screenshot'), submitPayment)
  .get(protect, isAdmin, getAllPayments);

router.put('/:paymentId/verify', protect, isAdmin, verifyPayment);
router.put('/:paymentId/reject', protect, isAdmin, rejectPayment);

export default router;

import express from 'express';
import {
  createRazorpayOrder,
  verifyRazorpayPayment,
  razorpayWebhook,
  getAllPayments,
  retryPayment,
} from '../controllers/payment/index.js';
import { protect, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// ── Customer: Create Razorpay order (POST /api/payments/razorpay/create-order)
router.post('/razorpay/create-order', protect, createRazorpayOrder);

// ── Customer: Retry payment for unpaid order (POST /api/payments/retry)
router.post('/retry', protect, retryPayment);

// ── Customer: Verify payment signature after checkout (POST /api/payments/razorpay/verify)
router.post('/razorpay/verify', protect, verifyRazorpayPayment);

// ── Razorpay Webhook (POST /api/payments/razorpay/webhook)
// Raw body is applied in app.js BEFORE express.json() for this specific path
router.post('/razorpay/webhook', razorpayWebhook);

// ── Admin: List all payment records (GET /api/payments)
router.get('/', protect, isAdmin, getAllPayments);

export default router;

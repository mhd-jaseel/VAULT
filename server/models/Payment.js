import mongoose from 'mongoose';

// Stores Razorpay payment events / webhook records for idempotency and audit
const paymentSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // ── Razorpay identifiers ──────────────────────────────────────
    razorpayOrderId: {
      type: String,
      required: true,
      trim: true,
    },
    razorpayPaymentId: {
      type: String,
      trim: true,
    },
    razorpaySignature: {
      type: String,
      trim: true,
    },

    // ── Payment state ─────────────────────────────────────────────
    // pending   → Razorpay order created, awaiting payment
    // captured  → payment verified and captured
    // failed    → payment failed or signature invalid
    // refunded  → refund issued via Razorpay
    status: {
      type: String,
      enum: ['pending', 'captured', 'failed', 'refunded'],
      default: 'pending',
    },

    // Amount in paise (integer), e.g. ₹9999 → 999900
    amountPaise: {
      type: Number,
    },
    currency: {
      type: String,
      default: 'INR',
    },

    // ── Webhook idempotency ───────────────────────────────────────
    // Stores the Razorpay webhook event ID to prevent duplicate processing
    webhookEventId: {
      type: String,
      trim: true,
    },
    webhookEvent: {
      type: String, // e.g. 'payment.captured', 'payment.failed'
      trim: true,
    },

    // ── Refund fields (for future use) ────────────────────────────
    razorpayRefundId: {
      type: String,
      trim: true,
    },
    refundAmount: {
      type: Number,
    },
    refundStatus: {
      type: String,
      enum: ['none', 'partial', 'full'],
      default: 'none',
    },
  },
  { timestamps: true }
);

// Index for fast lookup by Razorpay IDs
paymentSchema.index({ razorpayOrderId: 1 });
paymentSchema.index({ razorpayPaymentId: 1 });
paymentSchema.index({ webhookEventId: 1 }, { sparse: true });

const Payment = mongoose.model('Payment', paymentSchema);
export default Payment;

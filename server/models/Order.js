import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  image: {
    type: String,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  price: {
    type: Number,
    required: true,
  },
  itemDiscount: {
    type: Number,
    default: 0,
  },
  allocatedCouponDiscount: {
    type: Number,
    default: 0,
  },
  unitPaidAmount: {
    type: Number,
    required: true,
  },
  linePaidAmount: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'CANCEL_REQUESTED', 'CANCELLED', 'RETURN_REQUESTED', 'RETURNED'],
    default: 'ACTIVE',
  },
});

const timelineSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'packed', 'shipped', 'delivered', 'partially_cancelled', 'cancelled'],
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  note: {
    type: String,
  },
});

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    items: [orderItemSchema],
    shippingAddress: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zip: { type: String, required: true },
      country: { type: String, default: 'India' },
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    shippingCharges: {
      type: Number,
      default: 0,
    },
    handlingCharge: {
      type: Number,
      default: 0,
    },
    shippingCampaign: {
      type: String,
      trim: true,
    },
    isFreeShippingApplied: {
      type: Boolean,
      default: false,
    },
    grandTotal: {
      type: Number,
      required: true,
    },

    // ── Payment Method ──────────────────────────────────────────────
    paymentMethod: {
      type: String,
      enum: ['RAZORPAY', 'VAULT_WALLET', 'WALLET_RAZORPAY', 'razorpay', 'vault_wallet'],
      required: true,
      default: 'RAZORPAY',
    },

    // ── Split Payment Details ───────────────────────────────────────
    walletAmountPaid: {
      type: Number,
      default: 0,
    },
    razorpayAmountPaid: {
      type: Number,
      default: 0,
    },

    // ── Payment Status ──────────────────────────────────────────────
    // PENDING, SUCCESS, FAILED (also backward compatible with captured/authorized)
    paymentStatus: {
      type: String,
      enum: ['PENDING', 'SUCCESS', 'FAILED', 'pending', 'authorized', 'captured', 'failed', 'refunded'],
      default: 'PENDING',
    },

    // ── Razorpay identifiers ────────────────────────────────────────
    razorpayOrderId: {
      type: String,
      trim: true,
    },
    razorpayPaymentId: {
      type: String,
      trim: true,
    },
    razorpaySignatureVerified: {
      type: Boolean,
      default: false,
    },

    // ── Payment Attempts Log ─────────────────────────────────────────
    paymentAttempts: [
      {
        attemptId: { type: String },
        razorpayOrderId: { type: String },
        amount: { type: Number },
        status: { type: String, enum: ['PENDING', 'SUCCESS', 'FAILED'] },
        createdAt: { type: Date, default: Date.now },
      },
    ],

    // ── Idempotency guard — stock deducted exactly once ─────────────
    stockDeducted: {
      type: Boolean,
      default: false,
    },

    // ── Order Status ────────────────────────────────────────────────
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'packed', 'shipped', 'delivered', 'partially_cancelled', 'cancelled'],
      default: 'pending',
    },
    timeline: [timelineSchema],

    // ── Coupon ──────────────────────────────────────────────────────
    coupon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Coupon',
    },
    couponCode: {
      type: String,
      trim: true,
      uppercase: true,
    },
    discountAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    whatsappSent: {
      type: Boolean,
      default: false,
    },
    deliveredAt: {
      type: Date,
    },

    // ── Cancellation & Refund Details ──────────────────────────────
    cancellationReason: {
      type: String,
      trim: true,
    },
    cancelledBy: {
      type: String,
      enum: ['CUSTOMER', 'ADMIN', null],
      default: null,
    },
    cancelledAt: {
      type: Date,
    },
    refundStatus: {
      type: String,
      enum: ['NOT_REFUNDED', 'REFUNDED', 'NOT_APPLICABLE'],
      default: 'NOT_APPLICABLE',
    },
    refundedAmount: {
      type: Number,
      default: 0,
    },
    refundedAt: {
      type: Date,
    },
    refundedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    refundTransactionReference: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ paymentStatus: 1, createdAt: -1 });
orderSchema.index({ razorpayOrderId: 1 });
orderSchema.index({ createdAt: -1 });

const Order = mongoose.model('Order', orderSchema);
export default Order;

import mongoose from 'mongoose';

const returnSchema = new mongoose.Schema(
  {
    returnId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    orderItem: {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
      price: {
        type: Number,
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
        min: 1,
      },
      totalOriginalPaid: {
        type: Number,
        required: true,
      },
    },
    returnType: {
      type: String,
      enum: ['refund', 'replacement'],
      required: true,
    },
    reason: {
      type: String,
      enum: [
        'Damaged product',
        'Wrong product received',
        'Defective product',
        'Product doesn\'t match description',
        'Quality issue',
        'Other',
      ],
      required: true,
    },
    customerNotes: {
      type: String,
      trim: true,
    },
    evidenceImages: [
      {
        type: String,
      },
    ],

    // ── Replacement Specific Fields ────────────────────────────────────────
    replacementProduct: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
    },
    replacementProductName: {
      type: String,
    },
    replacementProductImage: {
      type: String,
    },
    replacementPrice: {
      type: Number,
    },
    additionalAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    replacementPaymentStatus: {
      type: String,
      enum: ['NOT_REQUIRED', 'PENDING', 'PAID', 'FAILED'],
      default: 'NOT_REQUIRED',
    },
    razorpayOrderId: {
      type: String,
      trim: true,
    },
    razorpayPaymentId: {
      type: String,
      trim: true,
    },
    stockReserved: {
      type: Boolean,
      default: false,
    },

    // ── Primary Return Status ──────────────────────────────────────────────
    status: {
      type: String,
      enum: [
        'REQUESTED',
        'APPROVED',
        'REJECTED',
        'RECEIVED',
        'INSPECTING',
        'REFUND_PROCESSING',
        'REFUNDED',
        'REPLACEMENT_PROCESSING',
        'REPLACEMENT_SHIPPED',
        'COMPLETED',
        'CANCELLED',
      ],
      default: 'REQUESTED',
    },

    // ── Manual Refund Audit Details ────────────────────────────────────────
    refundDetails: {
      amount: { type: Number },
      method: { type: String, enum: ['UPI', 'Bank Transfer', 'Other'] },
      transactionId: { type: String, trim: true },
      refundDate: { type: Date },
      adminNotes: { type: String, trim: true },
      proofImage: { type: String },
    },

    rejectionReason: {
      type: String,
      trim: true,
    },

    timeline: [
      {
        status: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        note: { type: String },
      },
    ],

    deliveredAtSnapshot: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

returnSchema.index({ user: 1, createdAt: -1 });
returnSchema.index({ order: 1, 'orderItem.product': 1 });

const Return = mongoose.model('Return', returnSchema);
export default Return;

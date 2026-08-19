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
      enum: ['RETURN', 'CANCELLATION', 'REPLACEMENT'],
      default: 'RETURN',
    },
    settlementMethod: {
      type: String,
      enum: ['WALLET'],
      default: 'WALLET',
    },
    reason: {
      type: String,
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

    // ── Wallet Credit Tracking ──────────────────────────────────────────────
    walletCreditStatus: {
      type: String,
      enum: ['NOT_APPLICABLE', 'PENDING', 'CREDITED'],
      default: 'NOT_APPLICABLE',
    },
    walletTransaction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WalletTransaction',
    },

    // ── Customer Return Shipment Details ──────────────────────────────────
    customerShipment: {
      courierName: {
        type: String,
        trim: true,
      },
      trackingNumber: {
        type: String,
        trim: true,
      },
      shippedAt: {
        type: Date,
      },
      notes: {
        type: String,
        trim: true,
      },
    },
    customerShippedAt: {
      type: Date,
    },
    productReceivedAt: {
      type: Date,
    },

    // ── Return Shipping Address Snapshot (Captured when Approved) ───────────
    returnShippingAddressSnapshot: {
      recipientName: { type: String, trim: true },
      addressLine1: { type: String, trim: true },
      addressLine2: { type: String, trim: true },
      city: { type: String, trim: true },
      district: { type: String, trim: true },
      state: { type: String, trim: true },
      pinCode: { type: String, trim: true },
      phone: { type: String, trim: true },
      whatsapp: { type: String, trim: true },
      instructions: { type: String, trim: true },
    },

    // ── Primary Return / Cancellation Status ──────────────────────────────────────────────
    status: {
      type: String,
      enum: [
        'REQUESTED',
        'APPROVED',
        'ITEM_SHIPPED',
        'PRODUCT_RECEIVED',
        'REPLACEMENT_APPROVED',
        'REPLACEMENT_SHIPPED',
        'REJECTED',
        'WALLET_CREDITED',
        'COMPLETED',
        'CANCELLED',
      ],
      default: 'REQUESTED',
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

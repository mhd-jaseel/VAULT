import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        'NEW_ORDER',
        'PAYMENT_VERIFICATION_REQUIRED',
        'RETURN_REQUEST',
        'REPLACEMENT_REQUEST',
        'REFUND_ACTION_REQUIRED',
        'LOW_STOCK',
        'OUT_OF_STOCK',
        'ORDER_CANCELLED',
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    relatedId: {
      type: String,
      required: true,
    },
    relatedType: {
      type: String,
      enum: ['Order', 'Payment', 'Return', 'Replacement', 'Product', 'WalletTransaction'],
      required: true,
    },
    action: {
      type: String,
      enum: [
        'REVIEW_ORDER',
        'VERIFY_PAYMENT',
        'REVIEW_RETURN',
        'REVIEW_REPLACEMENT',
        'PROCESS_REFUND',
        'RESTOCK_PRODUCT',
        'REVIEW_CANCELLATION',
      ],
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

notificationSchema.index({ isRead: 1, createdAt: -1 });
notificationSchema.index({ type: 1, relatedId: 1 });

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;

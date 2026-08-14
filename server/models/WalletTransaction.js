import mongoose from 'mongoose';

const walletTransactionSchema = new mongoose.Schema(
  {
    transactionId: {
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
    wallet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Wallet',
    },
    type: {
      type: String,
      enum: ['CREDIT', 'DEBIT'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    balanceBefore: {
      type: Number,
      required: true,
    },
    balanceAfter: {
      type: Number,
      required: true,
    },
    source: {
      type: String,
      enum: ['RETURN_CREDIT', 'CANCELLATION_CREDIT', 'ORDER_PAYMENT', 'ADMIN_ADJUSTMENT', 'REPLACEMENT_FALLBACK_CREDIT'],
      required: true,
    },
    referenceId: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    createdBy: {
      type: String,
      default: 'SYSTEM',
    },
    performedByAdminEmail: {
      type: String,
      trim: true,
    },
    performedByAdminName: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

walletTransactionSchema.index({ user: 1, createdAt: -1 });
walletTransactionSchema.index({ source: 1, referenceId: 1, type: 1 });

const WalletTransaction = mongoose.model('WalletTransaction', walletTransactionSchema);
export default WalletTransaction;

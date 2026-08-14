import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    targetUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    performedByAdminId: {
      type: String,
      required: true,
    },
    performedByAdminEmail: {
      type: String,
      required: true,
    },
    adminRole: {
      type: String,
      default: 'SUPER_ADMIN',
    },
    action: {
      type: String,
      required: true,
      enum: ['WALLET_ADJUSTMENT'],
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    direction: {
      type: String,
      required: true,
      enum: ['CREDIT', 'DEBIT'],
    },
    balanceBefore: {
      type: Number,
      required: true,
    },
    balanceAfter: {
      type: Number,
      required: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    referenceTransactionId: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

auditLogSchema.index({ targetUserId: 1, createdAt: -1 });
auditLogSchema.index({ performedByAdminEmail: 1, createdAt: -1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
export default AuditLog;

import mongoose from 'mongoose';
import User from '../models/User.js';
import WalletTransaction from '../models/WalletTransaction.js';
import Return from '../models/Return.js';
import AuditLog from '../models/AuditLog.js';
import Wallet from '../models/Wallet.js';
import { isReplicaSet } from '../config/db.js';

const generateTransactionId = () => {
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `WLT-TXN-${rand}`;
};

/**
 * Safely credit customer's Vault Wallet.
 * Handles both RETURN_CREDIT and CANCELLATION_CREDIT.
 * Idempotent: Prevents duplicate wallet credits for the same reference ID & source.
 */
export const creditWallet = async ({ userId, amount, source, referenceId, description, adminUserId = 'SYSTEM' }) => {
  if (!amount || amount <= 0) {
    throw new Error('Wallet credit amount must be greater than zero.');
  }

  // Duplicate guard
  const existingTxn = await WalletTransaction.findOne({
    source,
    referenceId: referenceId.toString(),
    type: 'CREDIT',
  });

  if (existingTxn) {
    const user = await User.findById(userId);
    return { success: true, message: 'Already credited to Vault Wallet.', user, transaction: existingTxn };
  }

  // Fetch and update user balance
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found for wallet credit.');

  const balanceBefore = user.walletBalance || 0;
  const balanceAfter = balanceBefore + amount;

  user.walletBalance = balanceAfter;
  await user.save();

  const transaction = new WalletTransaction({
    transactionId: generateTransactionId(),
    user: userId,
    type: 'CREDIT',
    amount,
    balanceBefore,
    balanceAfter,
    source,
    referenceId: referenceId.toString(),
    description: description || `${source.replace('_', ' ')} credited ₹${amount}`,
    createdBy: adminUserId ? adminUserId.toString() : 'SYSTEM',
  });

  await transaction.save();

  return { success: true, user, transaction };
};

/**
 * Safely debit customer's Vault Wallet for order payments.
 */
export const debitWallet = async ({ userId, amount, referenceId, description }) => {
  if (!amount || amount <= 0) {
    throw new Error('Debit amount must be greater than zero.');
  }

  const user = await User.findById(userId);
  if (!user || (user.walletBalance || 0) < amount) {
    throw new Error('Your Vault Wallet balance is insufficient for this order.');
  }

  const balanceBefore = user.walletBalance || 0;
  const balanceAfter = balanceBefore - amount;

  user.walletBalance = balanceAfter;
  await user.save();

  const transaction = new WalletTransaction({
    transactionId: generateTransactionId(),
    user: userId,
    type: 'DEBIT',
    amount,
    balanceBefore,
    balanceAfter,
    source: 'ORDER_PAYMENT',
    referenceId: referenceId.toString(),
    description: description || `Order Payment #${referenceId}`,
    createdBy: userId.toString(),
  });

  await transaction.save();

  return { success: true, user, transaction };
};

/**
 * Legacy wrapper for backward compatibility with return controllers
 */
export const creditReturnToWallet = async (returnId, adminUserId = 'SYSTEM') => {
  const returnRecord = await Return.findById(returnId);
  if (!returnRecord) throw new Error('Return record not found.');

  if (returnRecord.walletCreditStatus === 'CREDITED') {
    return { success: true, message: 'Already credited to Vault Wallet.', returnRecord };
  }

  const creditAmount = returnRecord.orderItem.totalOriginalPaid;
  let creditSource = 'RETURN_CREDIT';
  let creditDesc = `Return Credit for #${returnRecord.returnId} (${returnRecord.orderItem.name})`;

  if (returnRecord.returnType === 'CANCELLATION') {
    creditSource = 'CANCELLATION_CREDIT';
    creditDesc = `Cancellation Credit for #${returnRecord.returnId} (${returnRecord.orderItem.name})`;
  } else if (returnRecord.returnType === 'REPLACEMENT') {
    creditSource = 'REPLACEMENT_FALLBACK_CREDIT';
    creditDesc = `Replacement Unavailable - Fallback Credit for #${returnRecord.returnId} (${returnRecord.orderItem.name})`;
  }

  const result = await creditWallet({
    userId: returnRecord.user,
    amount: creditAmount,
    source: creditSource,
    referenceId: returnRecord._id.toString(),
    description: creditDesc,
    adminUserId,
  });

  returnRecord.walletCreditStatus = 'CREDITED';
  returnRecord.walletTransaction = result.transaction._id;
  returnRecord.status = 'WALLET_CREDITED';
  returnRecord.timeline.push({
    status: 'WALLET_CREDITED',
    note: `₹${creditAmount.toLocaleString('en-IN')} credited to Vault Wallet. Txn: ${result.transaction.transactionId}`,
  });

  await returnRecord.save();

  return { success: true, user: result.user, transaction: result.transaction, returnRecord };
};

export const adjustWalletSuperAdmin = async ({
  userId,
  amount,
  direction, // 'CREDIT' | 'DEBIT'
  reason,
  adminUser, // req.user object (or super admin data)
  idempotencyKey,
}) => {
  if (!amount || isNaN(amount) || !isFinite(amount) || amount <= 0) {
    throw new Error('Enter a valid adjustment amount.');
  }

  if (amount > 1000000) {
    throw new Error('Adjustment amount exceeds maximum single transaction limit (₹10,00,000).');
  }

  if (!direction || !['CREDIT', 'DEBIT'].includes(direction)) {
    throw new Error('Adjustment direction must be either CREDIT or DEBIT.');
  }

  if (!reason || !reason.trim()) {
    throw new Error('A reason for manual wallet adjustment is mandatory.');
  }

  const sanitizedReason = reason.trim();
  const numericAmount = Math.round(Number(amount) * 100) / 100; // Round to 2 decimal places

  let session = null;
  let supportsTransactions = false;

  // Determine if connected database is a replica set / mongos cluster
  const topology = mongoose.connection?.client?.topology;
  const topType = topology?.description?.type;
  const canUseTxn = isReplicaSet || topType === 'ReplicaSetWithPrimary' || topType === 'Sharded';

  if (canUseTxn) {
    try {
      session = await mongoose.startSession();
      session.startTransaction();
      supportsTransactions = true;
    } catch (sessErr) {
      if (session) {
        try { session.endSession(); } catch (_) {}
      }
      session = null;
      supportsTransactions = false;
    }
  }

  try {
    // Execution helper function
    const executeAdjustment = async (activeSession) => {
      const sessionOpt = activeSession ? { session: activeSession } : {};

      // 1. Idempotency check if key provided
      if (idempotencyKey) {
        const existingTxn = await WalletTransaction.findOne(
          { source: 'ADMIN_ADJUSTMENT', referenceId: idempotencyKey },
          null,
          sessionOpt
        );

        if (existingTxn) {
          const existingUser = await User.findById(userId, null, sessionOpt);
          return {
            success: true,
            isDuplicate: true,
            message: 'Adjustment was already processed.',
            user: existingUser,
            transaction: existingTxn,
            balanceBefore: existingTxn.balanceBefore,
            balanceAfter: existingTxn.balanceAfter,
          };
        }
      }

      // 2. Fetch customer user
      const user = await User.findById(userId, null, sessionOpt);
      if (!user) {
        throw new Error('User not found.');
      }

      const balanceBefore = Number(user.walletBalance || 0);
      let balanceAfter;

      // 3. Calculate and validate new balance
      if (direction === 'CREDIT') {
        balanceAfter = Math.round((balanceBefore + numericAmount) * 100) / 100;
      } else {
        if (balanceBefore < numericAmount) {
          throw new Error('Insufficient wallet balance.');
        }
        balanceAfter = Math.round((balanceBefore - numericAmount) * 100) / 100;
        if (balanceAfter < 0) {
          throw new Error('Insufficient wallet balance.');
        }
      }

      // 4. Update user wallet balance
      user.walletBalance = balanceAfter;
      if (activeSession) {
        await user.save({ session: activeSession });
      } else {
        await user.save();
      }

      // 5. Sync Wallet model
      await Wallet.findOneAndUpdate(
        { user: userId },
        { balance: balanceAfter, currency: 'INR' },
        { upsert: true, new: true, ...(activeSession ? { session: activeSession } : {}) }
      );

      // 6. Generate Transaction record
      const txnId = generateTransactionId();
      const referenceId = idempotencyKey || txnId;

      const adminEmail = adminUser?.email || 'vault.co.6235@gmail.com';
      const adminName = adminUser?.name || 'Super Admin';
      const adminId = adminUser?._id?.toString() || 'admin_001';

      const transaction = new WalletTransaction({
        transactionId: txnId,
        user: userId,
        type: direction,
        amount: numericAmount,
        balanceBefore,
        balanceAfter,
        source: 'ADMIN_ADJUSTMENT',
        referenceId,
        description: `Manual Adjustment (${direction === 'CREDIT' ? 'Credit' : 'Debit'}): ${sanitizedReason}`,
        createdBy: adminId,
        performedByAdminEmail: adminEmail,
        performedByAdminName: adminName,
      });

      if (activeSession) {
        await transaction.save({ session: activeSession });
      } else {
        await transaction.save();
      }

      // 7. Generate Audit Log
      const auditLog = new AuditLog({
        targetUserId: userId,
        performedByAdminId: adminId,
        performedByAdminEmail: adminEmail,
        adminRole: 'SUPER_ADMIN',
        action: 'WALLET_ADJUSTMENT',
        amount: numericAmount,
        direction,
        balanceBefore,
        balanceAfter,
        reason: sanitizedReason,
        referenceTransactionId: txnId,
      });

      if (activeSession) {
        await auditLog.save({ session: activeSession });
      } else {
        await auditLog.save();
      }

      return {
        success: true,
        user,
        transaction,
        auditLog,
        balanceBefore,
        balanceAfter,
      };
    };

    let result;
    if (supportsTransactions && session) {
      try {
        result = await executeAdjustment(session);
        await session.commitTransaction();
      } catch (txnError) {
        await session.abortTransaction();
        throw txnError;
      }
    } else {
      result = await executeAdjustment(null);
    }

    return result;
  } finally {
    if (session) {
      try {
        session.endSession();
      } catch (_) {}
    }
  }
};


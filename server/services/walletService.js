import mongoose from 'mongoose';
import User from '../models/User.js';
import WalletTransaction from '../models/WalletTransaction.js';
import Return from '../models/Return.js';

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

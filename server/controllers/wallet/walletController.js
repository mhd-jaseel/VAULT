import User from '../../models/User.js';
import WalletTransaction from '../../models/WalletTransaction.js';
import Wallet from '../../models/Wallet.js';
import { adjustWalletSuperAdmin } from '../../services/walletService.js';
import { createNotificationHelper } from '../../services/notificationHelper.js';

// GET /api/wallet
export const getMyWallet = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('walletBalance name email');
    res.json({
      success: true,
      data: {
        balance: user ? user.walletBalance || 0 : 0,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/wallet/transactions
export const getMyWalletTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 20;

    const total = await WalletTransaction.countDocuments({ user: req.user._id });
    const transactions = await WalletTransaction.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    res.json({
      success: true,
      data: transactions,
      page: pageNum,
      pages: Math.ceil(total / limitNum) || 1,
      total,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/wallet/admin/all — Financial transaction list with filters, search, and pagination (Admin only)
export const getAdminWalletTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 20, type, search, sort = 'latest', range = 'all' } = req.query;

    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 20;

    const query = {};

    if (type && type !== 'all') {
      if (type === 'CREDIT' || type === 'DEBIT') {
        query.type = type;
      } else {
        query.source = type;
      }
    }

    // Date range filtering
    if (range && range !== 'all') {
      const now = new Date();
      let startDate = new Date();

      if (range === 'today') {
        startDate.setHours(0, 0, 0, 0);
      } else if (range === 'this_week') {
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1);
        startDate = new Date(now.setDate(diff));
        startDate.setHours(0, 0, 0, 0);
      } else if (range === 'this_month') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      } else if (range === 'this_year') {
        startDate = new Date(now.getFullYear(), 0, 1);
      }

      query.createdAt = { $gte: startDate };
    }

    // Sorting order
    let sortOptions = { createdAt: -1 };
    if (sort === 'oldest') {
      sortOptions = { createdAt: 1 };
    } else if (sort === 'highest') {
      sortOptions = { amount: -1 };
    } else if (sort === 'lowest') {
      sortOptions = { amount: 1 };
    }

    // Server-side search by transactionId, referenceId, description
    let matchQuery = { ...query };
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      matchQuery.$or = [
        { transactionId: searchRegex },
        { referenceId: searchRegex },
        { description: searchRegex },
        { performedByAdminEmail: searchRegex },
        { performedByAdminName: searchRegex },
      ];
    }

    const total = await WalletTransaction.countDocuments(matchQuery);

    const transactions = await WalletTransaction.find(matchQuery)
      .populate('user', 'name email phone')
      .sort(sortOptions)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean();

    // Summary Cards metrics calculation
    const allTxns = await WalletTransaction.find().lean();
    const totalCount = allTxns.length;
    let totalCredits = 0;
    let totalDebits = 0;
    let totalRefunds = 0;

    allTxns.forEach((t) => {
      if (t.type === 'CREDIT') {
        totalCredits += t.amount || 0;
        if (t.source === 'RETURN_CREDIT' || t.source === 'CANCELLATION_CREDIT') {
          totalRefunds += t.amount || 0;
        }
      } else if (t.type === 'DEBIT') {
        totalDebits += t.amount || 0;
      }
    });

    const aggregateWallets = await Wallet.find().lean();
    const totalWalletBalance = aggregateWallets.reduce((sum, w) => sum + (w.balance || 0), 0);

    res.json({
      success: true,
      data: transactions,
      summary: {
        totalTransactions: totalCount,
        totalCredits,
        totalDebits,
        totalRefunds,
        totalWalletBalance,
      },
      pagination: {
        page: pageNum,
        pages: Math.ceil(total / limitNum) || 1,
        total,
      },
    });
  } catch (error) {
    console.error('[VAULT] admin wallet transactions error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/wallet/admin/users/:userId — Fetch customer wallet info and recent wallet transactions for Admin User Details
export const getUserWalletDetails = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;

    const user = await User.findById(userId).select('walletBalance name email isBlocked');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const total = await WalletTransaction.countDocuments({ user: userId });
    const transactions = await WalletTransaction.find({ user: userId })
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean();

    res.json({
      success: true,
      data: {
        walletBalance: user.walletBalance || 0,
        currency: 'INR',
        status: user.isBlocked ? 'Inactive (Account Blocked)' : 'Active',
        transactions,
        pagination: {
          page: pageNum,
          pages: Math.ceil(total / limitNum) || 1,
          total,
        },
      },
    });
  } catch (error) {
    console.error('[VAULT] getUserWalletDetails error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/wallet/admin/users/:userId/adjust — Super Admin only wallet adjustment
export const adjustUserWallet = async (req, res) => {
  try {
    const { userId } = req.params;
    const { amount, direction, reason, idempotencyKey } = req.body;

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'Target customer user account not found.' });
    }

    const result = await adjustWalletSuperAdmin({
      userId,
      amount: Number(amount),
      direction,
      reason,
      adminUser: req.user,
      idempotencyKey,
    });

    // Create a notification for the customer / system
    try {
      const formattedAmt = `₹${result.transaction.amount.toLocaleString('en-IN')}`;
      const notifTitle = direction === 'CREDIT' ? 'Vault Wallet Credited' : 'Vault Wallet Deducted';
      const notifMessage =
        direction === 'CREDIT'
          ? `${formattedAmt} has been added to your Vault Wallet. Reason: ${reason}`
          : `${formattedAmt} has been deducted from your Vault Wallet. Reason: ${reason}`;

      await createNotificationHelper({
        type: 'REFUND_ACTION_REQUIRED',
        title: notifTitle,
        message: notifMessage,
        relatedId: result.transaction._id.toString(),
        relatedType: 'WalletTransaction',
        action: 'PROCESS_REFUND',
      });
    } catch (notifErr) {
      console.warn('[VAULT] Could not create adjustment notification:', notifErr.message);
    }

    res.json({
      success: true,
      message: `Successfully ${direction === 'CREDIT' ? 'credited' : 'deducted'} ₹${result.transaction.amount.toLocaleString('en-IN')} ${direction === 'CREDIT' ? 'to' : 'from'} customer's Vault Wallet.`,
      data: {
        balanceBefore: result.balanceBefore,
        balanceAfter: result.balanceAfter,
        walletBalance: result.balanceAfter,
        transaction: result.transaction,
        auditLog: result.auditLog,
      },
    });
  } catch (error) {
    console.error('[VAULT] adjustUserWallet error:', error);
    const statusCode = error.message.includes('Insufficient') || error.message.includes('must be') ? 400 : 500;
    res.status(statusCode).json({ success: false, message: error.message });
  }
};

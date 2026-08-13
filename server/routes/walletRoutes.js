import express from 'express';
import { getMyWallet, getMyWalletTransactions } from '../controllers/walletController.js';
import Wallet from '../models/Wallet.js';
import WalletTransaction from '../models/WalletTransaction.js';
import { protect, isAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, getMyWallet);
router.get('/transactions', protect, getMyWalletTransactions);

// GET /api/wallet/admin/all — Financial transaction list with filters, search, and pagination (Admin only)
router.get('/admin/all', protect, isAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, type, search, sort = 'latest', range = 'all' } = req.query;

    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 20;

    const query = {};

    if (type && type !== 'all') {
      if (type === 'CREDIT') {
        query.type = 'RETURN_REPLACEMENT_CREDIT';
      } else if (type === 'DEBIT') {
        query.type = { $in: ['REPLACEMENT_DEBIT', 'ORDER_WALLET_PAYMENT'] };
      } else if (type === 'ADJUSTMENT') {
        query.type = 'ADJUSTMENT';
      } else {
        query.type = type;
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
      if (t.type === 'RETURN_REPLACEMENT_CREDIT') {
        totalCredits += t.amount || 0;
        totalRefunds += t.amount || 0;
      } else if (t.type === 'REPLACEMENT_DEBIT' || t.type === 'ORDER_WALLET_PAYMENT') {
        totalDebits += t.amount || 0;
      } else if (t.type === 'ADJUSTMENT') {
        if (t.amount > 0) totalCredits += t.amount;
        else totalDebits += Math.abs(t.amount);
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
});

export default router;

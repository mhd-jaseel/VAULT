import User from '../models/User.js';
import WalletTransaction from '../models/WalletTransaction.js';

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

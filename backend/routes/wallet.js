import express from 'express';
import WalletTransaction from '../models/WalletTransaction.js';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/v1/wallet
// @desc    Get wallet balance and info
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('walletBalance totalEarnings totalSpent subscription');

    res.json({
      success: true,
      data: {
        balance: user.walletBalance,
        totalEarnings: user.totalEarnings,
        totalSpent: user.totalSpent,
        subscription: user.subscription
      }
    });
  } catch (error) {
    console.error('Get wallet error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching wallet info'
    });
  }
});

// @route   GET /api/v1/wallet/transactions
// @desc    Get wallet transactions
// @access  Private
router.get('/transactions', protect, async (req, res) => {
  try {
    const { page = 1, limit = 20, type, category } = req.query;

    const query = { user: req.user._id };
    if (type) query.type = type;
    if (category) query.category = category;

    const transactions = await WalletTransaction.find(query)
      .populate('relatedNote', 'title')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await WalletTransaction.countDocuments(query);

    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching transactions'
    });
  }
});

// @route   POST /api/v1/wallet/topup
// @desc    Add money to wallet (placeholder for payment gateway)
// @access  Private
router.post('/topup', protect, async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid amount'
      });
    }

    // TODO: Integrate with Razorpay or other payment gateway
    // For now, this is a placeholder that directly adds money

    const user = await User.findById(req.user._id);
    user.walletBalance += Number(amount);
    await user.save();

    await WalletTransaction.create({
      user: user._id,
      type: 'CREDIT',
      amount: Number(amount),
      category: 'TOP_UP',
      description: 'Wallet top-up',
      balanceAfter: user.walletBalance
    });

    res.json({
      success: true,
      message: 'Wallet topped up successfully',
      data: {
        newBalance: user.walletBalance
      }
    });
  } catch (error) {
    console.error('Topup error:', error);
    res.status(500).json({
      success: false,
      message: 'Error topping up wallet'
    });
  }
});

export default router;

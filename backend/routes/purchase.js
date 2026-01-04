import express from 'express';
import Note from '../models/Note.js';
import Purchase from '../models/Purchase.js';
import User from '../models/User.js';
import WalletTransaction from '../models/WalletTransaction.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Commission percentage (platform fee)
const PLATFORM_COMMISSION = 0.15; // 15%

// @route   POST /api/v1/purchase/note/:noteId
// @desc    Purchase a note
// @access  Private
router.post('/note/:noteId', protect, async (req, res) => {
  try {
    const note = await Note.findById(req.params.noteId);

    if (!note || note.isDeleted || note.status !== 'ACTIVE') {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }

    // Check if already purchased
    const existingPurchase = await Purchase.findOne({
      user: req.user._id,
      note: note._id
    });

    if (existingPurchase) {
      return res.status(400).json({
        success: false,
        message: 'You have already purchased this note'
      });
    }

    // Check if free
    if (note.isFree || note.price === 0) {
      const purchase = await Purchase.create({
        user: req.user._id,
        note: note._id,
        price: 0
      });

      note.purchases += 1;
      await note.save();

      return res.json({
        success: true,
        message: 'Note accessed successfully',
        data: { purchase }
      });
    }

    // Check wallet balance
    const user = await User.findById(req.user._id);

    if (user.walletBalance < note.price) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient wallet balance'
      });
    }

    // Calculate amounts
    const platformFee = note.price * PLATFORM_COMMISSION;
    const creatorAmount = note.price - platformFee;

    // Deduct from buyer
    user.walletBalance -= note.price;
    user.totalSpent += note.price;
    await user.save();

    // Credit to creator
    const creator = await User.findById(note.creator);
    creator.walletBalance += creatorAmount;
    creator.totalEarnings += creatorAmount;
    await creator.save();

    // Create purchase record
    const purchase = await Purchase.create({
      user: req.user._id,
      note: note._id,
      price: note.price
    });

    // Create wallet transactions
    await WalletTransaction.create([
      {
        user: req.user._id,
        type: 'DEBIT',
        amount: note.price,
        category: 'NOTE_PURCHASE',
        description: `Purchased: ${note.title}`,
        relatedNote: note._id,
        relatedPurchase: purchase._id,
        balanceAfter: user.walletBalance
      },
      {
        user: creator._id,
        type: 'CREDIT',
        amount: creatorAmount,
        category: 'NOTE_SALE',
        description: `Sale: ${note.title}`,
        relatedNote: note._id,
        relatedPurchase: purchase._id,
        balanceAfter: creator.walletBalance
      }
    ]);

    // Update note stats
    note.purchases += 1;
    await note.save();

    res.json({
      success: true,
      message: 'Note purchased successfully',
      data: {
        purchase,
        newBalance: user.walletBalance
      }
    });
  } catch (error) {
    console.error('Purchase note error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error purchasing note'
    });
  }
});

// @route   POST /api/v1/purchase/subscription
// @desc    Purchase PLUS subscription
// @access  Private
router.post('/subscription', protect, async (req, res) => {
  try {
    const subscriptionPrice = Number(process.env.MONTHLY_SUBSCRIPTION_PRICE) || 479;

    const user = await User.findById(req.user._id);

    if (user.walletBalance < subscriptionPrice) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient wallet balance'
      });
    }

    // Check if already has active subscription
    if (user.hasActiveSubscription()) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active subscription'
      });
    }

    // Deduct from wallet
    user.walletBalance -= subscriptionPrice;
    user.totalSpent += subscriptionPrice;

    // Activate subscription
    const now = new Date();
    const endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

    user.subscription = {
      plan: 'PLUS',
      startDate: now,
      endDate: endDate,
      isActive: true
    };

    await user.save();

    // Create transaction
    await WalletTransaction.create({
      user: user._id,
      type: 'DEBIT',
      amount: subscriptionPrice,
      category: 'SUBSCRIPTION',
      description: 'PLUS subscription (30 days)',
      balanceAfter: user.walletBalance
    });

    res.json({
      success: true,
      message: 'Subscription activated successfully',
      data: {
        subscription: user.subscription,
        newBalance: user.walletBalance
      }
    });
  } catch (error) {
    console.error('Purchase subscription error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error purchasing subscription'
    });
  }
});

// @route   GET /api/v1/purchase/my-purchases
// @desc    Get user's purchases
// @access  Private
router.get('/my-purchases', protect, async (req, res) => {
  try {
    const purchases = await Purchase.find({ user: req.user._id })
      .populate('note', 'title subject price creator')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: { purchases }
    });
  } catch (error) {
    console.error('Get purchases error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching purchases'
    });
  }
});

// @route   POST /api/v1/purchase/:purchaseId/annotate
// @desc    Add annotation to purchased note
// @access  Private
router.post('/:purchaseId/annotate', protect, async (req, res) => {
  try {
    const { pageNumber, content, position } = req.body;

    const purchase = await Purchase.findOne({
      _id: req.params.purchaseId,
      user: req.user._id
    });

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: 'Purchase not found'
      });
    }

    purchase.annotations.push({
      pageNumber,
      content,
      position
    });

    await purchase.save();

    res.json({
      success: true,
      data: { annotations: purchase.annotations }
    });
  } catch (error) {
    console.error('Add annotation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding annotation'
    });
  }
});

// @route   POST /api/v1/purchase/:purchaseId/comment
// @desc    Add comment to purchased note
// @access  Private
router.post('/:purchaseId/comment', protect, async (req, res) => {
  try {
    const { pageNumber, content } = req.body;

    const purchase = await Purchase.findOne({
      _id: req.params.purchaseId,
      user: req.user._id
    });

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: 'Purchase not found'
      });
    }

    purchase.comments.push({
      pageNumber,
      content
    });

    await purchase.save();

    res.json({
      success: true,
      data: { comments: purchase.comments }
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding comment'
    });
  }
});

export default router;

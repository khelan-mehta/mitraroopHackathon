import express from 'express';
import Note from '../models/Note.js';
import { protect, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/v1/admin/similarity-queue
// @desc    Get notes flagged for similarity review
// @access  Private (Admin only)
router.get('/similarity-queue', protect, isAdmin, async (req, res) => {
  try {
    const notes = await Note.find({
      status: 'PAUSED_FOR_REVIEW',
      isDeleted: false
    })
      .populate('creator', 'name email')
      .populate('similarNotes.noteId', 'title creator')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: { notes }
    });
  } catch (error) {
    console.error('Get similarity queue error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching similarity queue'
    });
  }
});

// @route   POST /api/v1/admin/note/:id/approve
// @desc    Approve a note
// @access  Private (Admin only)
router.post('/note/:id/approve', protect, isAdmin, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }

    note.status = 'ACTIVE';
    await note.save();

    res.json({
      success: true,
      message: 'Note approved and activated',
      data: { note }
    });
  } catch (error) {
    console.error('Approve note error:', error);
    res.status(500).json({
      success: false,
      message: 'Error approving note'
    });
  }
});

// @route   POST /api/v1/admin/note/:id/reject
// @desc    Reject a note
// @access  Private (Admin only)
router.post('/note/:id/reject', protect, isAdmin, async (req, res) => {
  try {
    const { reason } = req.body;

    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }

    note.status = 'REJECTED';
    if (reason) {
      note.similarityReason = reason;
    }
    await note.save();

    // TODO: Send notification to creator

    res.json({
      success: true,
      message: 'Note rejected',
      data: { note }
    });
  } catch (error) {
    console.error('Reject note error:', error);
    res.status(500).json({
      success: false,
      message: 'Error rejecting note'
    });
  }
});

// @route   GET /api/v1/admin/stats
// @desc    Get platform statistics
// @access  Private (Admin only)
router.get('/stats', protect, isAdmin, async (req, res) => {
  try {
    const User = (await import('../models/User.js')).default;
    const Purchase = (await import('../models/Purchase.js')).default;
    const WalletTransaction = (await import('../models/WalletTransaction.js')).default;

    const [
      totalUsers,
      totalNoteMakers,
      totalNotes,
      activeNotes,
      pendingReview,
      totalPurchases,
      totalRevenue
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: { $in: ['NOTEMAKER', 'ADMIN'] } }),
      Note.countDocuments({ isDeleted: false }),
      Note.countDocuments({ status: 'ACTIVE', isDeleted: false }),
      Note.countDocuments({ status: 'PAUSED_FOR_REVIEW' }),
      Purchase.countDocuments(),
      WalletTransaction.aggregate([
        { $match: { category: 'NOTE_PURCHASE', type: 'DEBIT' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])
    ]);

    res.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          noteMakers: totalNoteMakers
        },
        notes: {
          total: totalNotes,
          active: activeNotes,
          pendingReview: pendingReview
        },
        purchases: totalPurchases,
        revenue: totalRevenue[0]?.total || 0
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics'
    });
  }
});

export default router;

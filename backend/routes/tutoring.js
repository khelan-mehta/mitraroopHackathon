import express from 'express';
import Tutoring from '../models/Tutoring.js';
import Note from '../models/Note.js';
import User from '../models/User.js';
import WalletTransaction from '../models/WalletTransaction.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @route   POST /api/v1/tutoring/request
// @desc    Create tutoring request
// @access  Private
router.post('/request', protect, async (req, res) => {
  try {
    const { noteId, message, proposedPrice } = req.body;

    if (!noteId || !message || !proposedPrice) {
      return res.status(400).json({
        success: false,
        message: 'Note, message, and proposed price are required'
      });
    }

    const note = await Note.findById(noteId);
    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }

    const tutoring = await Tutoring.create({
      student: req.user._id,
      tutor: note.creator,
      note: noteId,
      message,
      proposedPrice
    });

    await tutoring.populate('note', 'title');

    res.status(201).json({
      success: true,
      message: 'Tutoring request sent successfully',
      data: { tutoring }
    });
  } catch (error) {
    console.error('Create tutoring request error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating tutoring request'
    });
  }
});

// @route   GET /api/v1/tutoring/my-requests
// @desc    Get user's tutoring requests (as student)
// @access  Private
router.get('/my-requests', protect, async (req, res) => {
  try {
    const requests = await Tutoring.find({ student: req.user._id })
      .populate('tutor', 'name email')
      .populate('note', 'title subject')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: { requests }
    });
  } catch (error) {
    console.error('Get tutoring requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching tutoring requests'
    });
  }
});

// @route   GET /api/v1/tutoring/requests-for-me
// @desc    Get tutoring requests for user (as tutor)
// @access  Private
router.get('/requests-for-me', protect, async (req, res) => {
  try {
    const requests = await Tutoring.find({ tutor: req.user._id })
      .populate('student', 'name email')
      .populate('note', 'title subject')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: { requests }
    });
  } catch (error) {
    console.error('Get tutoring requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching tutoring requests'
    });
  }
});

// @route   POST /api/v1/tutoring/:id/respond
// @desc    Respond to tutoring request (accept/reject)
// @access  Private
router.post('/:id/respond', protect, async (req, res) => {
  try {
    const { status, tutorResponse, finalPrice, sessionDetails } = req.body;

    if (!status || !['ACCEPTED', 'REJECTED'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Valid status (ACCEPTED/REJECTED) is required'
      });
    }

    const tutoring = await Tutoring.findById(req.params.id);

    if (!tutoring) {
      return res.status(404).json({
        success: false,
        message: 'Tutoring request not found'
      });
    }

    // Check if user is the tutor
    if (tutoring.tutor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to respond to this request'
      });
    }

    if (tutoring.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'This request has already been responded to'
      });
    }

    tutoring.status = status;
    tutoring.tutorResponse = tutorResponse;

    if (status === 'ACCEPTED') {
      tutoring.finalPrice = finalPrice || tutoring.proposedPrice;
      if (sessionDetails) {
        tutoring.sessionDetails = sessionDetails;
      }
    }

    await tutoring.save();

    res.json({
      success: true,
      message: `Tutoring request ${status.toLowerCase()} successfully`,
      data: { tutoring }
    });
  } catch (error) {
    console.error('Respond to tutoring error:', error);
    res.status(500).json({
      success: false,
      message: 'Error responding to tutoring request'
    });
  }
});

// @route   POST /api/v1/tutoring/:id/pay
// @desc    Pay for tutoring session
// @access  Private
router.post('/:id/pay', protect, async (req, res) => {
  try {
    const tutoring = await Tutoring.findById(req.params.id);

    if (!tutoring) {
      return res.status(404).json({
        success: false,
        message: 'Tutoring request not found'
      });
    }

    // Check if user is the student
    if (tutoring.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    if (tutoring.status !== 'ACCEPTED') {
      return res.status(400).json({
        success: false,
        message: 'Tutoring session must be accepted first'
      });
    }

    if (tutoring.isPaid) {
      return res.status(400).json({
        success: false,
        message: 'Already paid for this session'
      });
    }

    const student = await User.findById(req.user._id);

    if (student.walletBalance < tutoring.finalPrice) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient wallet balance'
      });
    }

    // Deduct from student
    student.walletBalance -= tutoring.finalPrice;
    student.totalSpent += tutoring.finalPrice;
    await student.save();

    // Credit to tutor (no commission for tutoring)
    const tutor = await User.findById(tutoring.tutor);
    tutor.walletBalance += tutoring.finalPrice;
    tutor.totalEarnings += tutoring.finalPrice;
    await tutor.save();

    // Create transactions
    await WalletTransaction.create([
      {
        user: student._id,
        type: 'DEBIT',
        amount: tutoring.finalPrice,
        category: 'TUTORING',
        description: 'Tutoring session payment',
        relatedTutoring: tutoring._id,
        balanceAfter: student.walletBalance
      },
      {
        user: tutor._id,
        type: 'CREDIT',
        amount: tutoring.finalPrice,
        category: 'TUTORING',
        description: 'Tutoring session earnings',
        relatedTutoring: tutoring._id,
        balanceAfter: tutor.walletBalance
      }
    ]);

    tutoring.isPaid = true;
    tutoring.paidAt = new Date();
    await tutoring.save();

    res.json({
      success: true,
      message: 'Payment successful',
      data: {
        tutoring,
        newBalance: student.walletBalance
      }
    });
  } catch (error) {
    console.error('Pay for tutoring error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing payment'
    });
  }
});

export default router;

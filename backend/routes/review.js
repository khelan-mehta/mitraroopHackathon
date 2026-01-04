import express from 'express';
import Review from '../models/Review.js';
import Note from '../models/Note.js';
import Purchase from '../models/Purchase.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @route   POST /api/v1/review/notes/:noteId
// @desc    Create or update review for a note
// @access  Private
router.post('/notes/:noteId', protect, async (req, res) => {
  try {
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    const note = await Note.findById(req.params.noteId);
    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }

    // Check if user has purchased the note
    const purchase = await Purchase.findOne({
      user: req.user._id,
      note: note._id
    });

    if (!purchase && !note.isFree) {
      return res.status(403).json({
        success: false,
        message: 'You must purchase the note before reviewing it'
      });
    }

    // Check if review already exists
    let review = await Review.findOne({
      user: req.user._id,
      note: note._id
    });

    if (review) {
      // Update existing review
      const oldRating = review.rating;
      review.rating = rating;
      review.comment = comment;
      await review.save();

      // Update note rating
      const totalRating = (note.rating.average * note.rating.count) - oldRating + rating;
      note.rating.average = totalRating / note.rating.count;
      await note.save();
    } else {
      // Create new review
      review = await Review.create({
        user: req.user._id,
        note: note._id,
        rating,
        comment
      });

      // Update note rating
      const totalRating = (note.rating.average * note.rating.count) + rating;
      note.rating.count += 1;
      note.rating.average = totalRating / note.rating.count;
      await note.save();
    }

    res.json({
      success: true,
      message: 'Review submitted successfully',
      data: { review }
    });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating review'
    });
  }
});

// @route   GET /api/v1/review/notes/:noteId
// @desc    Get reviews for a note
// @access  Public
router.get('/notes/:noteId', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const reviews = await Review.find({ note: req.params.noteId })
      .populate('user', 'name')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Review.countDocuments({ note: req.params.noteId });

    res.json({
      success: true,
      data: {
        reviews,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching reviews'
    });
  }
});

export default router;

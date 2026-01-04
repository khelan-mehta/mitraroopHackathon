import express from 'express';
import Note from '../models/Note.js';
import Purchase from '../models/Purchase.js';
import { protect } from '../middleware/auth.js';
import { generatePageSummary, generateBriefSummary, generateQuiz, generateFlashcards } from '../services/aiService.js';

const router = express.Router();

// @route   GET /api/v1/marketplace/notes
// @desc    Get all marketplace notes with filters
// @access  Public
router.get('/notes', async (req, res) => {
  try {
    const { subject, minPrice, maxPrice, isFree, keyword, sortBy, page = 1, limit = 20 } = req.query;

    // Build query
    const query = {
      status: 'ACTIVE',
      isDeleted: false
    };

    if (subject) query.subject = subject;
    if (isFree === 'true') query.isFree = true;
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    if (keyword) {
      query.$text = { $search: keyword };
    }

    // Build sort
    let sort = { createdAt: -1 };
    if (sortBy === 'price_asc') sort = { price: 1 };
    if (sortBy === 'price_desc') sort = { price: -1 };
    if (sortBy === 'rating') sort = { 'rating.average': -1 };
    if (sortBy === 'popular') sort = { purchases: -1, views: -1 };

    const notes = await Note.find(query)
      .populate('creator', 'name bio subjects')
      .sort(sort)
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Note.countDocuments(query);

    res.json({
      success: true,
      data: {
        notes,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get marketplace notes error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching notes'
    });
  }
});

// @route   GET /api/v1/marketplace/notes/:id
// @desc    Get single note (with access control)
// @access  Public/Private
router.get('/notes/:id', async (req, res) => {
  try {
    const note = await Note.findById(req.params.id)
      .populate('creator', 'name bio subjects education');

    if (!note || note.isDeleted || note.status !== 'ACTIVE') {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }

    // Increment views
    note.views += 1;
    await note.save();

    // Check if user has purchased or if note is free
    let hasPurchased = note.isFree;
    let purchase = null;

    if (req.headers.authorization) {
      try {
        // Manually verify token to check purchase without requiring auth
        const token = req.headers.authorization.split(' ')[1];
        const jwt = await import('jsonwebtoken');
        const decoded = jwt.default.verify(token, process.env.JWT_SECRET);

        purchase = await Purchase.findOne({
          user: decoded.id,
          note: note._id
        });

        hasPurchased = hasPurchased || !!purchase;
      } catch (err) {
        // Token invalid, continue as guest
      }
    }

    // Return full content or preview
    const response = {
      success: true,
      data: {
        note: {
          id: note._id,
          title: note.title,
          subject: note.subject,
          description: note.description,
          price: note.price,
          isFree: note.isFree,
          creator: note.creator,
          rating: note.rating,
          views: note.views,
          purchases: note.purchases,
          totalPages: note.pages.length,
          tags: note.tags,
          createdAt: note.createdAt
        },
        hasPurchased,
        pages: hasPurchased
          ? note.pages
          : note.pages.slice(0, note.previewPages).map(p => ({
              ...p._doc,
              content: p.content.substring(0, 500) + '...'
            }))
      }
    };

    // Include user's annotations if purchased
    if (purchase) {
      response.data.annotations = purchase.annotations;
      response.data.comments = purchase.comments;
    }

    res.json(response);
  } catch (error) {
    console.error('Get note error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching note'
    });
  }
});

// @route   GET /api/v1/marketplace/subjects
// @desc    Get all unique subjects
// @access  Public
router.get('/subjects', async (req, res) => {
  try {
    const subjects = await Note.distinct('subject', {
      status: 'ACTIVE',
      isDeleted: false
    });

    res.json({
      success: true,
      data: { subjects }
    });
  } catch (error) {
    console.error('Get subjects error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching subjects'
    });
  }
});

// @route   POST /api/v1/marketplace/notes/:id/ai/summary
// @desc    Generate page summary (requires purchase or subscription)
// @access  Private
router.post('/notes/:id/ai/summary', protect, async (req, res) => {
  try {
    const { pageNumber } = req.body;

    const note = await Note.findById(req.params.id);
    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }

    // Check if user has purchased or has active subscription
    const purchase = await Purchase.findOne({
      user: req.user._id,
      note: note._id
    });

    const hasAccess = purchase || note.isFree || req.user.hasActiveSubscription();

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Purchase note or subscribe to PLUS to access AI features'
      });
    }

    const page = note.pages.find(p => p.pageNumber === pageNumber);
    if (!page) {
      return res.status(404).json({
        success: false,
        message: 'Page not found'
      });
    }

    const summary = await generatePageSummary(page.content);

    res.json({
      success: true,
      data: { summary }
    });
  } catch (error) {
    console.error('Generate summary error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error generating summary'
    });
  }
});

// @route   POST /api/v1/marketplace/notes/:id/ai/brief-summary
// @desc    Generate brief summary
// @access  Private
router.post('/notes/:id/ai/brief-summary', protect, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }

    const purchase = await Purchase.findOne({
      user: req.user._id,
      note: note._id
    });

    const hasAccess = purchase || note.isFree || req.user.hasActiveSubscription();

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Purchase note or subscribe to PLUS to access AI features'
      });
    }

    const summary = await generateBriefSummary(note.pages);

    res.json({
      success: true,
      data: { summary }
    });
  } catch (error) {
    console.error('Generate brief summary error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error generating summary'
    });
  }
});

// @route   POST /api/v1/marketplace/notes/:id/ai/quiz
// @desc    Generate quiz
// @access  Private
router.post('/notes/:id/ai/quiz', protect, async (req, res) => {
  try {
    const { numberOfQuestions = 10 } = req.body;

    const note = await Note.findById(req.params.id);
    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }

    const purchase = await Purchase.findOne({
      user: req.user._id,
      note: note._id
    });

    const hasAccess = purchase || note.isFree || req.user.hasActiveSubscription();

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Purchase note or subscribe to PLUS to access AI features'
      });
    }

    const content = note.pages.map(p => p.content).join('\n\n');
    const quiz = await generateQuiz(content, numberOfQuestions);

    res.json({
      success: true,
      data: { quiz }
    });
  } catch (error) {
    console.error('Generate quiz error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error generating quiz'
    });
  }
});

// @route   POST /api/v1/marketplace/notes/:id/ai/flashcards
// @desc    Generate flashcards
// @access  Private
router.post('/notes/:id/ai/flashcards', protect, async (req, res) => {
  try {
    const { numberOfCards = 10 } = req.body;

    const note = await Note.findById(req.params.id);
    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }

    const purchase = await Purchase.findOne({
      user: req.user._id,
      note: note._id
    });

    const hasAccess = purchase || note.isFree || req.user.hasActiveSubscription();

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Purchase note or subscribe to PLUS to access AI features'
      });
    }

    const content = note.pages.map(p => p.content).join('\n\n');
    const flashcards = await generateFlashcards(content, numberOfCards);

    res.json({
      success: true,
      data: { flashcards }
    });
  } catch (error) {
    console.error('Generate flashcards error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error generating flashcards'
    });
  }
});

export default router;

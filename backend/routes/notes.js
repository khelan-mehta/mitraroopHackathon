import express from 'express';
import Note from '../models/Note.js';
import { protect, isNoteMaker } from '../middleware/auth.js';
import { checkNoteSimilarity } from '../services/aiService.js';

const router = express.Router();

// @route   POST /api/v1/notes/create
// @desc    Create a new note
// @access  Private (NoteMaker only)
router.post('/create', protect, isNoteMaker, async (req, res) => {
  try {
    const { title, subject, description, pages, price, tags } = req.body;

    if (!title || !subject || !description || !pages || pages.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Title, subject, description, and pages are required'
      });
    }

    // Get existing notes in the same subject for similarity check
    const existingNotes = await Note.find({
      subject,
      status: 'ACTIVE',
      isDeleted: false
    }).select('title pages').limit(10);

    let similarityResult = { score: 0, reason: 'No similar notes found', similarNoteIds: [] };

    // Run similarity check if there are existing notes
    if (existingNotes.length > 0) {
      const noteContent = pages.map(p => p.content).join('\n');
      similarityResult = await checkNoteSimilarity(noteContent, existingNotes);
    }

    // Determine initial status based on similarity
    let status = 'ACTIVE';
    if (similarityResult.score > 8) {
      status = 'PAUSED_FOR_REVIEW';
    }

    // Create note
    const note = await Note.create({
      title,
      subject,
      description,
      pages: pages.map((p, idx) => ({
        pageNumber: idx + 1,
        content: p.content,
        images: p.images || []
      })),
      price: price || 0,
      creator: req.user._id,
      status,
      similarityScore: similarityResult.score,
      similarityReason: similarityResult.reason,
      similarNotes: similarityResult.similarNoteIds.map(id => ({ noteId: id, score: similarityResult.score })),
      tags: tags || []
    });

    res.status(201).json({
      success: true,
      data: { note },
      message: status === 'PAUSED_FOR_REVIEW'
        ? 'Note created but paused for review due to similarity concerns'
        : 'Note created successfully'
    });
  } catch (error) {
    console.error('Create note error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating note'
    });
  }
});

// @route   GET /api/v1/notes/mine
// @desc    Get notes created by logged-in notemaker
// @access  Private (NoteMaker only)
router.get('/mine', protect, isNoteMaker, async (req, res) => {
  try {
    const notes = await Note.find({
      creator: req.user._id,
      isDeleted: false
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: { notes }
    });
  } catch (error) {
    console.error('Get my notes error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching notes'
    });
  }
});

// @route   PUT /api/v1/notes/:id/update
// @desc    Update a note
// @access  Private (NoteMaker only, own notes)
router.put('/:id/update', protect, isNoteMaker, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }

    // Check ownership
    if (note.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this note'
      });
    }

    // Can't update if under review
    if (note.status === 'PAUSED_FOR_REVIEW') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update note while under review'
      });
    }

    const { title, subject, description, pages, price, tags } = req.body;

    if (title) note.title = title;
    if (subject) note.subject = subject;
    if (description) note.description = description;
    if (price !== undefined) note.price = price;
    if (tags) note.tags = tags;

    if (pages) {
      note.pages = pages.map((p, idx) => ({
        pageNumber: idx + 1,
        content: p.content,
        images: p.images || []
      }));

      // Re-run similarity check
      const existingNotes = await Note.find({
        subject: note.subject,
        status: 'ACTIVE',
        isDeleted: false,
        _id: { $ne: note._id }
      }).select('title pages').limit(10);

      if (existingNotes.length > 0) {
        const noteContent = pages.map(p => p.content).join('\n');
        const similarityResult = await checkNoteSimilarity(noteContent, existingNotes);

        note.similarityScore = similarityResult.score;
        note.similarityReason = similarityResult.reason;

        if (similarityResult.score > 8) {
          note.status = 'PAUSED_FOR_REVIEW';
        }
      }
    }

    await note.save();

    res.json({
      success: true,
      data: { note }
    });
  } catch (error) {
    console.error('Update note error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating note'
    });
  }
});

// @route   DELETE /api/v1/notes/:id
// @desc    Soft delete a note
// @access  Private (NoteMaker only, own notes)
router.delete('/:id', protect, isNoteMaker, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }

    // Check ownership
    if (note.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this note'
      });
    }

    note.isDeleted = true;
    note.status = 'DRAFT';
    await note.save();

    res.json({
      success: true,
      message: 'Note deleted successfully'
    });
  } catch (error) {
    console.error('Delete note error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting note'
    });
  }
});

export default router;

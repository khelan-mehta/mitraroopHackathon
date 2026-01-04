import express from 'express';
import multer from 'multer';
import Note from '../models/Note.js';
import { protect, isNoteMaker } from '../middleware/auth.js';
import { checkNoteSimilarity, extractTextFromImage, analyzeNoteImages } from '../services/aiService.js';
import { uploadFile, uploadBase64Image } from '../services/s3Service.js';

const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 10 // Max 10 files at once
  },
  fileFilter: (req, file, cb) => {
    // Accept images only
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

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

// @route   POST /api/v1/notes/upload-images
// @desc    Upload images to S3
// @access  Private (NoteMaker only)
router.post('/upload-images', protect, isNoteMaker, upload.array('images', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No images provided'
      });
    }

    const uploadPromises = req.files.map(file =>
      uploadFile(file.buffer, file.originalname, file.mimetype)
    );

    const results = await Promise.all(uploadPromises);

    res.json({
      success: true,
      data: {
        images: results.map(r => ({
          url: r.url,
          key: r.key
        }))
      }
    });
  } catch (error) {
    console.error('Upload images error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error uploading images'
    });
  }
});

// @route   POST /api/v1/notes/upload-base64
// @desc    Upload base64 encoded image to S3
// @access  Private (NoteMaker only)
router.post('/upload-base64', protect, isNoteMaker, async (req, res) => {
  try {
    const { image, fileName } = req.body;

    if (!image) {
      return res.status(400).json({
        success: false,
        message: 'No image data provided'
      });
    }

    const result = await uploadBase64Image(image, fileName || 'image.jpg');

    res.json({
      success: true,
      data: {
        url: result.url,
        key: result.key
      }
    });
  } catch (error) {
    console.error('Upload base64 error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error uploading image'
    });
  }
});

// @route   POST /api/v1/notes/extract-text
// @desc    Extract text from uploaded image using AI
// @access  Private (NoteMaker only)
router.post('/extract-text', protect, isNoteMaker, async (req, res) => {
  try {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        message: 'Image URL is required'
      });
    }

    const extractedText = await extractTextFromImage(imageUrl);

    res.json({
      success: true,
      data: {
        text: extractedText
      }
    });
  } catch (error) {
    console.error('Extract text error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error extracting text from image'
    });
  }
});

// @route   POST /api/v1/notes/analyze-images
// @desc    Analyze multiple note images and generate comprehensive content
// @access  Private (NoteMaker only)
router.post('/analyze-images', protect, isNoteMaker, async (req, res) => {
  try {
    const { imageUrls, subject } = req.body;

    if (!imageUrls || imageUrls.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Image URLs are required'
      });
    }

    const analysis = await analyzeNoteImages(imageUrls, subject || 'General');

    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    console.error('Analyze images error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error analyzing images'
    });
  }
});

// @route   POST /api/v1/notes/create-from-images
// @desc    Create a note from uploaded images with AI text extraction
// @access  Private (NoteMaker only)
router.post('/create-from-images', protect, isNoteMaker, upload.array('images', 20), async (req, res) => {
  try {
    const { title, subject, description, price, tags } = req.body;

    if (!title || !subject) {
      return res.status(400).json({
        success: false,
        message: 'Title and subject are required'
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one image is required'
      });
    }

    // Upload all images to S3
    const uploadPromises = req.files.map(file =>
      uploadFile(file.buffer, file.originalname, file.mimetype)
    );
    const uploadResults = await Promise.all(uploadPromises);
    const imageUrls = uploadResults.map(r => r.url);

    // Analyze images and extract text
    const analysis = await analyzeNoteImages(imageUrls, subject);

    // Create pages from the extracted content
    const pages = imageUrls.map((url, idx) => ({
      pageNumber: idx + 1,
      content: analysis.extractedText || '',
      images: [url]
    }));

    // Create the note
    const note = await Note.create({
      title,
      subject,
      description: description || analysis.summary || '',
      pages,
      price: price ? Number(price) : 0,
      creator: req.user._id,
      status: 'ACTIVE',
      tags: tags ? (typeof tags === 'string' ? tags.split(',').map(t => t.trim()) : tags) : [],
      aiExtractedContent: {
        summary: analysis.summary,
        keyPoints: analysis.keyPoints,
        extractedAt: new Date()
      }
    });

    res.status(201).json({
      success: true,
      data: {
        note,
        aiAnalysis: {
          summary: analysis.summary,
          keyPoints: analysis.keyPoints
        }
      },
      message: 'Note created from images successfully'
    });
  } catch (error) {
    console.error('Create from images error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating note from images'
    });
  }
});

export default router;

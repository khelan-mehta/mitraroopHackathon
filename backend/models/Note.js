import mongoose from 'mongoose';

const noteSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  // Content structure - array of pages with rich content
  pages: [{
    pageNumber: Number,
    content: String, // Rich text / Markdown
    images: [String] // Image URLs
  }],
  price: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  isFree: {
    type: Boolean,
    default: function() {
      return this.price === 0;
    }
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'PAUSED_FOR_REVIEW', 'REJECTED', 'DRAFT'],
    default: 'DRAFT'
  },
  // AI Similarity Check
  similarityScore: {
    type: Number,
    min: 0,
    max: 10,
    default: 0
  },
  similarityReason: String,
  similarNotes: [{
    noteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Note'
    },
    score: Number
  }],
  // Stats
  views: {
    type: Number,
    default: 0
  },
  purchases: {
    type: Number,
    default: 0
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  // Preview settings
  previewPages: {
    type: Number,
    default: 3,
    min: 1
  },
  // Tags for better search
  tags: [String],
  // AI extracted content from images
  aiExtractedContent: {
    summary: String,
    keyPoints: [String],
    extractedAt: Date
  },
  // Soft delete
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for better search performance
noteSchema.index({ title: 'text', subject: 'text', description: 'text', tags: 'text' });
noteSchema.index({ subject: 1, price: 1 });
noteSchema.index({ 'rating.average': -1 });
noteSchema.index({ creator: 1 });
noteSchema.index({ status: 1 });

// Virtual for total pages
noteSchema.virtual('totalPages').get(function() {
  return this.pages.length;
});

const Note = mongoose.model('Note', noteSchema);

export default Note;

import mongoose from 'mongoose';

const purchaseSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  note: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Note',
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  // User annotations (private to user)
  annotations: [{
    pageNumber: Number,
    content: String,
    position: {
      x: Number,
      y: Number
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  // User comments (private notes)
  comments: [{
    pageNumber: Number,
    content: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Access tracking
  lastAccessedAt: Date,
  accessCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate purchases
purchaseSchema.index({ user: 1, note: 1 }, { unique: true });

const Purchase = mongoose.model('Purchase', purchaseSchema);

export default Purchase;

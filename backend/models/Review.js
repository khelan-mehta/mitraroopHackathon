import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
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
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    trim: true,
    maxlength: 500
  },
  // Helpful votes
  helpfulVotes: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Only one review per user per note
reviewSchema.index({ user: 1, note: 1 }, { unique: true });

const Review = mongoose.model('Review', reviewSchema);

export default Review;

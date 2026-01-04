import mongoose from 'mongoose';

const replySchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
    trim: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const threadSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  forum: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Forum',
    required: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  isPinned: {
    type: Boolean,
    default: false
  },
  views: {
    type: Number,
    default: 0
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  replies: [replySchema],
  lastActivity: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const forumSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    default: '📚'
  },
  color: {
    type: String,
    enum: ['blue', 'purple', 'green', 'indigo', 'emerald', 'orange'],
    default: 'blue'
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

// Virtual for thread count
forumSchema.virtual('threadCount', {
  ref: 'Thread',
  localField: '_id',
  foreignField: 'forum',
  count: true
});

forumSchema.set('toJSON', { virtuals: true });
forumSchema.set('toObject', { virtuals: true });

export const Forum = mongoose.model('Forum', forumSchema);
export const Thread = mongoose.model('Thread', threadSchema);
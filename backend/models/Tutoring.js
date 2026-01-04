import mongoose from 'mongoose';

const tutoringSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tutor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  note: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Note',
    required: true
  },
  message: {
    type: String,
    required: true,
    maxlength: 500
  },
  proposedPrice: {
    type: Number,
    required: true,
    min: 0
  },
  finalPrice: Number,
  status: {
    type: String,
    enum: ['PENDING', 'ACCEPTED', 'REJECTED', 'COMPLETED', 'CANCELLED'],
    default: 'PENDING'
  },
  tutorResponse: String,
  // Session details (if accepted)
  sessionDetails: {
    scheduledAt: Date,
    duration: Number, // in minutes
    meetingLink: String,
    notes: String
  },
  // Payment status
  isPaid: {
    type: Boolean,
    default: false
  },
  paidAt: Date
}, {
  timestamps: true
});

// Indexes
tutoringSchema.index({ student: 1, status: 1 });
tutoringSchema.index({ tutor: 1, status: 1 });

const Tutoring = mongoose.model('Tutoring', tutoringSchema);

export default Tutoring;

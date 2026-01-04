import mongoose from 'mongoose';

const walletTransactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['CREDIT', 'DEBIT'],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: String,
    enum: ['NOTE_PURCHASE', 'NOTE_SALE', 'SUBSCRIPTION', 'REFUND', 'WITHDRAWAL', 'TOP_UP', 'TUTORING'],
    required: true
  },
  description: String,
  // Reference to related entities
  relatedNote: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Note'
  },
  relatedPurchase: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Purchase'
  },
  relatedTutoring: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tutoring'
  },
  // Balance after transaction
  balanceAfter: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'COMPLETED', 'FAILED'],
    default: 'COMPLETED'
  }
}, {
  timestamps: true
});

// Index for user's transaction history
walletTransactionSchema.index({ user: 1, createdAt: -1 });

const WalletTransaction = mongoose.model('WalletTransaction', walletTransactionSchema);

export default WalletTransaction;

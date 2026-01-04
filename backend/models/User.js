import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: function() {
      return !this.googleId;
    }
  },
  googleId: {
    type: String,
    sparse: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  avatar: {
    type: String,
    default: null
  },
  role: {
    type: String,
    enum: ['USER', 'NOTEMAKER', 'ADMIN'],
    default: 'USER'
  },
  // NoteMaker specific fields
  bio: String,
  education: String,
  interests: [String],
  subjects: [String],
  isVerified: {
    type: Boolean,
    default: false
  },
  // Wallet
  walletBalance: {
    type: Number,
    default: 0,
    min: 0
  },
  // Subscription
  subscription: {
    plan: {
      type: String,
      enum: ['FREE', 'PLUS'],
      default: 'FREE'
    },
    startDate: Date,
    endDate: Date,
    isActive: {
      type: Boolean,
      default: false
    }
  },
  // Stats
  totalEarnings: {
    type: Number,
    default: 0
  },
  totalSpent: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }

  if (this.password) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

// Compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Check if subscription is active
userSchema.methods.hasActiveSubscription = function() {
  if (this.subscription.plan === 'FREE') return false;
  if (!this.subscription.endDate) return false;
  return new Date() < this.subscription.endDate;
};

const User = mongoose.model('User', userSchema);

export default User;

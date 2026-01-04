import express from 'express';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/v1/user/me
// @desc    Get current user profile
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          role: user.role,
          bio: user.bio,
          education: user.education,
          interests: user.interests,
          subjects: user.subjects,
          walletBalance: user.walletBalance,
          subscription: user.subscription,
          totalEarnings: user.totalEarnings,
          totalSpent: user.totalSpent,
          hasActiveSubscription: user.hasActiveSubscription(),
          createdAt: user.createdAt
        }
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user profile'
    });
  }
});

// @route   PUT /api/v1/user/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, bio, education, interests, subjects } = req.body;

    const user = await User.findById(req.user._id);

    if (name) user.name = name;
    if (bio !== undefined) user.bio = bio;
    if (education !== undefined) user.education = education;
    if (interests) user.interests = interests;
    if (subjects && user.role === 'NOTEMAKER') user.subjects = subjects;

    await user.save();

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          role: user.role,
          bio: user.bio,
          education: user.education,
          interests: user.interests,
          subjects: user.subjects,
          walletBalance: user.walletBalance,
          subscription: user.subscription,
          totalEarnings: user.totalEarnings,
          totalSpent: user.totalSpent,
          hasActiveSubscription: user.hasActiveSubscription(),
          createdAt: user.createdAt
        }
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile'
    });
  }
});

// @route   POST /api/v1/user/upgrade/notemaker
// @desc    Upgrade user to NoteMaker
// @access  Private
router.post('/upgrade/notemaker', protect, async (req, res) => {
  try {
    const { bio, subjects, education } = req.body;

    if (!bio || !subjects || subjects.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Bio and at least one subject are required'
      });
    }

    const user = await User.findById(req.user._id);

    if (user.role === 'NOTEMAKER' || user.role === 'ADMIN') {
      return res.status(400).json({
        success: false,
        message: 'User is already a NoteMaker'
      });
    }

    user.role = 'NOTEMAKER';
    user.bio = bio;
    user.subjects = subjects;
    if (education) user.education = education;

    await user.save();

    res.json({
      success: true,
      message: 'Successfully upgraded to NoteMaker',
      data: { user }
    });
  } catch (error) {
    console.error('Upgrade to NoteMaker error:', error);
    res.status(500).json({
      success: false,
      message: 'Error upgrading to NoteMaker'
    });
  }
});

export default router;

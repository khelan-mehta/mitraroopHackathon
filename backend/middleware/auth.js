import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Verify JWT token
export const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, no token'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from token
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({
      success: false,
      message: 'Not authorized, token failed'
    });
  }
};

// Check if user is a NoteMaker
export const isNoteMaker = async (req, res, next) => {
  if (req.user && (req.user.role === 'NOTEMAKER' || req.user.role === 'ADMIN')) {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Access denied. NoteMaker role required.'
    });
  }
};

// Check if user is an Admin
export const isAdmin = async (req, res, next) => {
  if (req.user && req.user.role === 'ADMIN') {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin role required.'
    });
  }
};

// Check if user has active subscription
export const hasSubscription = async (req, res, next) => {
  if (req.user && req.user.hasActiveSubscription()) {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Active subscription required for this feature.'
    });
  }
};

// Generate JWT token
export const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

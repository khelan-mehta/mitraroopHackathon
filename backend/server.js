import dotenv from 'dotenv';
dotenv.config(); // ✅ MUST be first

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import passport from 'passport';

import connectDB from './config/database.js';
import { configurePassport } from './config/passport.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

// Routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/user.js';
import notesRoutes from './routes/notes.js';
import marketplaceRoutes from './routes/marketplace.js';
import purchaseRoutes from './routes/purchase.js';
import walletRoutes from './routes/wallet.js';
import reviewRoutes from './routes/review.js';
import tutoringRoutes from './routes/tutoring.js';
import adminRoutes from './routes/admin.js';

// Connect DB
connectDB();

// Init app
const app = express();

// Passport
configurePassport();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
  secret: process.env.JWT_SECRET || 'secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000
  }
}));
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.get('/', (req, res) => {
  res.json({ success: true, message: 'Notes Marketplace API' });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/user', userRoutes);
app.use('/api/v1/notes', notesRoutes);
app.use('/api/v1/marketplace', marketplaceRoutes);
app.use('/api/v1/purchase', purchaseRoutes);
app.use('/api/v1/wallet', walletRoutes);
app.use('/api/v1/review', reviewRoutes);
app.use('/api/v1/tutoring', tutoringRoutes);
app.use('/api/v1/admin', adminRoutes);

// Errors
app.use(notFound);
app.use(errorHandler);

// Start
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

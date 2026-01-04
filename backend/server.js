import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import passport from "passport";

import connectDB from "./config/database.js";
import { configurePassport } from "./config/passport.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";

// Routes
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/user.js";
import notesRoutes from "./routes/notes.js";
import marketplaceRoutes from "./routes/marketplace.js";
import purchaseRoutes from "./routes/purchase.js";
import walletRoutes from "./routes/wallet.js";
import reviewRoutes from "./routes/review.js";
import tutoringRoutes from "./routes/tutoring.js";
import adminRoutes from "./routes/admin.js";
import forumRoutes from "./routes/forum.js";

connectDB().catch(console.error);

const app = express();

configurePassport();

app.use(
  cors({
    origin: (origin, callback) => {
      // allow localhost + deployed frontend + tools like Postman
      callback(null, origin || "*");
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(passport.initialize());

// Routes
app.get("/", (req, res) => {
  res.json({ success: true, message: "Notes Marketplace API" });
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/notes", notesRoutes);
app.use("/api/v1/marketplace", marketplaceRoutes);
app.use("/api/v1/purchase", purchaseRoutes);
app.use("/api/v1/wallet", walletRoutes);
app.use("/api/v1/review", reviewRoutes);
app.use("/api/v1/tutoring", tutoringRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/forum", forumRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;

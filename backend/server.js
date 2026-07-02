import express from "express";
import path from 'path';
import { fileURLToPath } from 'url';
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import pool from "./config/database.js";

import passport from "./config/passport.js";
import authRoutes from "./routes/auth.js";
import videoRouter from "./routes/video.js";
import commentRoutes from "./routes/comments.js";
import { ApiRoutes } from "./config/resourceNames.js";
import "./cron/cleanup.js";
import moviesRoutes from "./routes/movies.js";
import commentsRoutes from './routes/comments.js';

import userRoutes from './routes/users.js';

import { UPLOADS_ROOT } from './config/uploads.js';


dotenv.config();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;
const frontendUrl = process.env.FRONTEND_URL || ApiRoutes.BaseUrl;

app.use(
  cors({
    origin: frontendUrl,
    credentials: true,
  }),
);

app.use(passport.initialize());
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginEmbedderPolicy: false,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const rateLimitHandler = (_req, res) => {
  res.status(200).json({ ok: false, message: 'Too many requests', code: 'RATE_LIMIT' });
};

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX) || 2000,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

app.use(ApiRoutes.API, apiLimiter);
app.use(ApiRoutes.Uploads, express.static(UPLOADS_ROOT));
app.use(ApiRoutes.Video, videoRouter);
app.use(ApiRoutes.Comments, commentRoutes);

app.get(ApiRoutes.Health, (req, res) => {
  res.json({ status: "ok", message: "HyperTube API is running" });
});

app.get(ApiRoutes.DBHealth, async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", message: "Database connection successful" });
  } catch (err) {
    res.status(200).json({
      ok: false,
      status: "error",
      message: "Database connection failed",
    });
  }
});
app.use('/subtitles', (req, res, next) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET');
    next();
}, express.static(path.resolve('./subtitles')));

app.use(ApiRoutes.Auth, authLimiter, authRoutes);
app.use("/api/users", userRoutes);
app.use('/api/movies', moviesRoutes);
app.use('/api/comments', commentsRoutes);
app.use('/subtitles', express.static(path.resolve('./subtitles')));

app.listen(PORT, () => {});

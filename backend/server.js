import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import pool from './config/database.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
import passport from './config/passport.js';
import authRoutes from './routes/auth.js';
import moviesRoutes from './routes/movies.js';
import commentsRoutes from './routes/comments.js';

import userRoutes from './routes/users.js';

import { UPLOADS_ROOT } from './config/uploads.js';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(passport.initialize());
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginEmbedderPolicy: false,
  })
);
app.use(morgan('combined'));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});

app.use('/api/', limiter);
app.use('/uploads', express.static(UPLOADS_ROOT));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'HyperTube API is running' });
});

app.get('/api/db/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', message: 'Database connection successful' });
  } catch (err) {
    res.status(503).json({
      status: 'error',
      message: 'Database connection failed',
      error: err.message
    });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

app.use('/api/movies', moviesRoutes);
app.use('/api/comments', commentsRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

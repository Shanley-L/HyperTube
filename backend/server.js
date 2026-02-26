import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import pool from './config/database.js';
import passport from './config/passport.js';
import authRoutes from './routes/auth.js';
import videoRouter from './routes/video.js';
import { ApiRoutes } from './config/resourceNames.js';
import './cron/cleanup.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: ApiRoutes.BaseUrl,
  credentials: true
}));

app.use(passport.initialize());
app.use(helmet());
app.use(morgan('combined'));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 100
});

app.use(ApiRoutes.API, limiter);
app.use(ApiRoutes.Video, videoRouter);

app.get(ApiRoutes.Health, (req, res) => {
  res.json({ status: 'ok', message: 'HyperTube API is running' });
});

app.get(ApiRoutes.DBHealth, async (req, res) => {
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

app.use(ApiRoutes.Auth, authRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Access the dashboard at: ${ApiRoutes.BaseUrl}`);
});

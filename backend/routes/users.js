import express from 'express';
import authMiddleware from '../middlewares/auth.js';
import { findById, toSafeUser } from '../models/user.js';

const router = express.Router();

router.get('/me', authMiddleware, async (req, res) => {
  const { userId } = req.user || {};
  if (!userId) return res.status(400).json({ message: 'Invalid token payload' });

  const user = await findById(userId);
  if (!user) return res.status(404).json({ message: 'User not found' });

  res.json(toSafeUser(user));
});

export default router;


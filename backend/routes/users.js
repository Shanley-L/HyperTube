import path from 'path';
import express from 'express';
import multer from 'multer';
import authMiddleware from '../middlewares/auth.js';
import { AVATARS_DIR } from '../config/uploads.js';
import { clientFail } from '../utils/clientResponse.js';
import {
  findAll,
  findById,
  findByUsername,
  findByEmail,
  toSafeUser,
  updateUserProfile,
  removeFavoriteMovie,
  getFavoriteMovies,
  upsertFavoriteMovieAndMetadata,
  getFavoriteMovieCardsFromDB,
} from '../models/user.js';

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, AVATARS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const safe = ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext) ? ext : '.jpg';
    cb(null, `${req.user.userId}${safe}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = /^image\/(jpeg|png|gif|webp)$/.test(file.mimetype);
    cb(ok ? null : new Error('Only JPEG, PNG, GIF, WebP'), ok);
  },
});

const router = express.Router();

router.get('/me', authMiddleware, async (req, res) => {
  const { userId } = req.user || {};
  if (!userId) return clientFail(res, { message: 'Invalid token payload' });
  const user = await findById(userId);
  if (!user) return clientFail(res, { message: 'User not found', code: 'USER_NOT_FOUND' });
  res.json(toSafeUser(user));
});

router.patch('/me', authMiddleware, async (req, res) => {
  const { userId } = req.user || {};
  if (!userId) return clientFail(res, { message: 'Invalid token payload' });
  const { username, first_name, last_name, email } = req.body;
  const current = await findById(userId);
  if (!current) return clientFail(res, { message: 'User not found' });
  if (username != null && username !== current.username) {
    const taken = await findByUsername(username);
    if (taken) return clientFail(res, { message: 'Username already taken' });
  }
  if (email != null && email !== current.email) {
    const taken = await findByEmail(email);
    if (taken) return clientFail(res, { message: 'Email already in use' });
  }
  try {
    const updated = await updateUserProfile(userId, {
      username: username ?? current.username,
      first_name: first_name !== undefined ? first_name : current.first_name,
      last_name: last_name !== undefined ? last_name : current.last_name,
      email: email ?? current.email,
    });
    res.json(toSafeUser(updated));
  } catch (e) {
    return clientFail(res, { message: e.message || 'Update failed' });
  }
});

router.post('/me/avatar', authMiddleware, (req, res) => {
  upload.single('avatar')(req, res, async (err) => {
    if (err) {
      return clientFail(res, { message: err.message || 'Upload failed' });
    }
    if (!req.file) return clientFail(res, { message: 'No file' });
    const { userId } = req.user;
    const profile_picture_url = `/uploads/avatars/${req.file.filename}`;
    await updateUserProfile(userId, { profile_picture_url });
    res.json({ profile_picture_url });
  });
});

router.get('/me/favorites', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.user || {};
    if (!userId) return clientFail(res, { message: 'Invalid token payload' });
    const favorites = await getFavoriteMovies(userId);
    res.json(favorites);
  } catch (e) {
    return clientFail(res, { message: e.message || 'Failed to load favorites', results: [] });
  }
});

router.post('/me/favorites', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.user || {};
    if (!userId) return clientFail(res, { message: 'Invalid token payload' });
    const movieId = String(req.body?.movieId ?? '').trim();
    if (!movieId) return clientFail(res, { message: 'movieId is required' });
    await upsertFavoriteMovieAndMetadata(userId, movieId);
    res.json({ movieId, favorited: true });
  } catch (e) {
    return clientFail(res, { message: e.message || 'Failed to add favorite' });
  }
});

router.get('/me/favorite-movies', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.user || {};
    if (!userId) return clientFail(res, { message: 'Invalid token payload' });
    const favorites = await getFavoriteMovieCardsFromDB(userId);
    res.json(favorites);
  } catch (e) {
    return clientFail(res, { message: e.message || 'Failed to load favorite movies', results: [] });
  }
});

router.delete('/me/favorites/:movieId', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.user || {};
    if (!userId) return clientFail(res, { message: 'Invalid token payload' });
    const movieId = String(req.params?.movieId ?? '').trim();
    if (!movieId) return clientFail(res, { message: 'movieId is required' });
    await removeFavoriteMovie(userId, movieId);
    res.json({ movieId, favorited: false });
  } catch (e) {
    return clientFail(res, { message: e.message || 'Failed to remove favorite' });
  }
});

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.user || {};
    if (!userId) return clientFail(res, { message: 'Invalid token payload' });
    const user = await findById(req.params.id);
    if (!user) return clientFail(res, { message: 'User not found' });
    if (user.id !== userId) {
      user.email = '';
    }
    res.json(toSafeUser(user));
  } catch (e) {
    return clientFail(res, { message: e.message || 'Failed to load user' });
  }
});

router.get('/', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.user || {};
    if (!userId) return clientFail(res, { message: 'Invalid token payload' });
    const users = await findAll();
    res.json(users.map(toSafeUser));
  } catch (e) {
    return clientFail(res, { message: e.message || 'Failed to load users', results: [] });
  }
});

export default router;

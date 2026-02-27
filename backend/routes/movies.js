import express from 'express';
import authMiddleware from '../middlewares/auth.js';
import moviesController from '../controllers/moviesController.js';

const router = express.Router();

router.get('/search', moviesController.search)

export default router;


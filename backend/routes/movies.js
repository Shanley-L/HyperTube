import express from 'express';
import authMiddleware from '../middlewares/auth.js';
import moviesController from '../controllers/moviesController.js';

const router = express.Router();

router.get('/search', moviesController.search)
router.get('/posters', moviesController.getPosters);

export default router;


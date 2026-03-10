import express from 'express';
import authMiddleware from '../middlewares/auth.js';
import moviesController from '../controllers/moviesController.js';

const router = express.Router();

router.get('/discover', moviesController.discover)
router.get('/search', moviesController.search)
router.post('/select', moviesController.select)
router.get('/posters', moviesController.getPosters);

export default router;


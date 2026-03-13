import express from 'express';
import authMiddleware from '../middlewares/auth.js';
import commentsController from '../controllers/commentsController.js';

const router = express.Router();

router.get('/:movieId', commentsController.getComments);
router.post('/', authMiddleware, commentsController.addComment);
router.put('/:id', authMiddleware, commentsController.updateComment);
router.delete('/:id', authMiddleware, commentsController.deleteComment);

export default router;
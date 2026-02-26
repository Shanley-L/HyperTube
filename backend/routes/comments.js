import express from 'express';
import pool from '../config/database.js';
import authMiddleware from '../middlewares/auth.js'; 

const router = express.Router();

router.get('/:movieId', async (req, res) => {
    try {
        const { movieId } = req.params;
        const result = await pool.query(
            `SELECT c.*, u.username, u.profile_picture_url 
             FROM comments c 
             JOIN users u ON c.user_id = u.id 
             WHERE c.movie_id = $1 
             ORDER BY c.created_at DESC`,
            [movieId]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/', authMiddleware, async (req, res) => {
    try {
        const { movie_id, content } = req.body;
        
        const result = await pool.query(
            `INSERT INTO comments (movie_id, user_id, content) 
             VALUES ($1, $2, $3) 
             RETURNING *`,
            [movie_id, req.user.id, content]
        );
        
        const fullComment = await pool.query(
            `SELECT c.*, u.username, u.profile_picture_url 
             FROM comments c JOIN users u ON c.user_id = u.id 
             WHERE c.id = $1`, [result.rows[0].id]
        );

        res.status(201).json(fullComment.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
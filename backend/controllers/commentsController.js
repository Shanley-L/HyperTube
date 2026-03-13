import * as userModel from '../models/user.js';

const commentController = {
    addComment: async (req, res) => {
        try {
            const { comment } = req.body;
            const { movieId } = req.body;
            
            const userId = req.user.userId;
            const userName = req.user.username;
            
            console.log("userId : ", userId);
            
            const result = await userModel.addComment(userId, userName, movieId, comment);
            res.json(result);
        } catch (error) {
            console.error('Error adding comment:', error);
            res.status(500).json({ message: 'Error adding comment' });
        }
    },
    getComments: async (req, res) => {
        try {
            const movieId = req.params.movieId;
            console.log(movieId);
            
            const result = await userModel.getComments(movieId);
            res.json(result);
        } catch (error) {
            console.error('Error getting comments:', error);
            res.status(500).json({ message: 'Error getting comments' });
        }
    },
    updateComment: async (req, res) => {
        try {
            const { id } = req.params;
            const { comment } = req.body;
            const userId = req.user.userId;
            
            const result = await userModel.updateComment(id, userId, comment);
            res.json(result);
        } catch (error) {
            console.error('Error updating comment:', error);
            res.status(500).json({ message: 'Error updating comment' });
        }
    },
    deleteComment: async (req, res) => {
        try {
            const { id } = req.params;
            const userId = req.user.userId;
            
            const result = await userModel.deleteComment(id, userId);
            res.json(result);
        } catch (error) {
            console.error('Error deleting comment:', error);
            res.status(500).json({ message: 'Error deleting comment' });
        }
    }
};

export default commentController;  
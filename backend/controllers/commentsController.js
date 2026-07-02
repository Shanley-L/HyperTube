import * as userModel from '../models/user.js';
import { clientFail } from '../utils/clientResponse.js';

const commentController = {
    addComment: async (req, res) => {
        try {
            const { comment, movieId } = req.body;

            if (!movieId || !comment) {
                return clientFail(res, { message: 'Missing movieId or comment content' });
            }

            const userId = req.user.userId;
            const userName = req.user.username;

            const result = await userModel.addComment(userId, userName, movieId, comment);
            res.json(result);
        } catch {
            return clientFail(res, { message: 'Error adding comment' });
        }
    },
    getComments: async (req, res) => {
        try {
            const { movieId } = req.params;
            const result = await userModel.getComments(movieId);
            res.json(result);
        } catch {
            return res.json([]);
        }
    },
    updateComment: async (req, res) => {
        try {
            const { id } = req.params;
            const { comment } = req.body;
            const userId = req.user.userId;

            const result = await userModel.updateComment(id, userId, comment);
            res.json(result);
        } catch {
            return clientFail(res, { message: 'Error updating comment' });
        }
    },
    deleteComment: async (req, res) => {
        try {
            const { id } = req.params;
            const userId = req.user.userId;

            const result = await userModel.deleteComment(id, userId);
            res.json(result);
        } catch {
            return clientFail(res, { message: 'Error deleting comment' });
        }
    }
};

export default commentController;

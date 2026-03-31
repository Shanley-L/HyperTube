import { useState, useEffect } from 'react';
import axios from 'axios';

const CommentsSection = ({ movieId, userId }) => {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState("");
	const commentsBaseUrl = "http://localhost:3000/api/comments/";

    useEffect(() => {
        const fetchComments = async () => {
            const res = await axios.get(`${commentsBaseUrl}${movieId}`);
            setComments(res.data);
        };
        fetchComments();
    }, [movieId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newComment.trim())
			return;

        try {
            const res = await axios.post(`${commentsBaseUrl}`, {
                movie_id: movieId,
                user_id: userId,
                content: newComment
            });
            setComments([res.data, ...comments]);
            setNewComment("");
        }
		catch (err) {
            console.error("Failed to post comment:", err);
        }
    };

    return (
        <div style={{ marginTop: '40px', textAlign: 'left', maxWidth: '800px', margin: '40px auto' }}>
            <h3>Comments ({comments.length})</h3>
            
            <form onSubmit={handleSubmit} style={{ marginBottom: '30px' }}>
                <textarea 
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    style={{ width: '100%', padding: '10px', borderRadius: '5px', background: '#222', color: 'white' }}
                />
                <button type="submit" style={{ marginTop: '10px', padding: '10px 20px', cursor: 'pointer' }}>Post</button>
            </form>

            <div className="comments-list">
                {comments.map(c => (
                    <div key={c.id} style={{ borderBottom: '1px solid #333', padding: '15px 0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <img src={c.profile_picture_url || 'https://via.placeholder.com/40'} alt="" style={{ width: '30px', height: '30px', borderRadius: '50%' }} />
                            <strong>{c.username}</strong>
                            <small style={{ color: '#666' }}>{new Date(c.created_at).toLocaleDateString()}</small>
                        </div>
                        <p style={{ marginTop: '8px' }}>{c.content}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};
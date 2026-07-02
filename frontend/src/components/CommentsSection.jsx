import { useState, useEffect } from 'react';
import api, { isApiFailure } from '../services/api';
import { resolveAvatarUrl } from '../utils/avatar';

const CommentsSection = ({ movieId, userId }) => {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState("");

    useEffect(() => {
        const fetchComments = async () => {
            const res = await api.get(`/comments/${movieId}`);
            if (!isApiFailure(res) && Array.isArray(res.data)) {
                setComments(res.data);
            }
        };
        fetchComments();
    }, [movieId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newComment.trim())
			return;

        try {
            const res = await api.post('/comments', {
                movieId,
                comment: newComment,
            });
            if (isApiFailure(res)) return;
            setComments([res.data, ...comments]);
            setNewComment("");
        }
		catch {
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
                            <img src={resolveAvatarUrl(c.profile_picture_url)} alt="" style={{ width: '30px', height: '30px', borderRadius: '50%' }} />
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
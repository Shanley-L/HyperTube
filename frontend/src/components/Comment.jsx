import { useState, useEffect } from "react";
import api from "../services/api";
import { Trash2 } from 'lucide-react';
import { useTranslation } from "react-i18next";

function Comment({ movieId }) { 
    const { t } = useTranslation();
    const [comments, setComments] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [editText, setEditText] = useState("");
    const [hoveredUserId, setHoveredUserId] = useState(null);
    const [authorInfo, setAuthorInfo] = useState(null);
    const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

    const fetchComments = async () => {
    if (!movieId) return;
    try {
        const response = await api.get(`/comments/${movieId}`);
        for (const comment of response.data) {
            if (comment.profile_picture_url == null) {
                comment.profile_picture_url = '/avatar-silhouette.svg';
            }
        }
        setComments(response.data.reverse());
    } catch (error) {
        console.error("Failed to fetch comments", error);
    }
};

    // 🔄 Fetch comments whenever movieId changes
    useEffect(() => {
        fetchComments();
    }, [movieId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const content = e.target.comment.value;
        try {
            const response = await api.post('/comments', {
                movieId: movieId,
                comment: content,
            });
            setComments([response.data, ...comments]);
            fetchComments();
            e.target.reset();
        } catch (error) {
            console.error('Error posting comment:', error);
        }
    };

    const startEditing = (comment) => {
        setEditingId(comment.id);
        setEditText(comment.content);
    };

    const handleUpdate = async (id) => {
        if (!editText.trim()) return setEditingId(null);
        try {
            await api.put(`/comments/${id}`, { comment: editText });
            setComments(comments.map((c) =>
                c.id === id ? { ...c, content: editText } : c
            ));
            setEditingId(null);
        } catch (error) {
            console.error('Error updating comment:', error);
        }
    };

    const handleDelete = async (id) => {
        try {
            await api.delete(`/comments/${id}`);
            setComments(comments.filter((c) => c.id !== id));
        } catch (error) {
            console.error('Error deleting comment:', error);
        }
    };

    const handleAuthorHover = async (e, userId) => {
        if (hoveredUserId === userId) return;
        try {
            const response = await api.get(`/users/${userId}`);
            setAuthorInfo(response.data);
            setHoveredUserId(userId);
            setTooltipPos({ x: e.clientX, y: e.clientY });
        } catch (error) {
            console.error('Error fetching user:', error);
        }
    };

    return (
        <div className="comments-section">
            <h1 className="comments-title">{t('comments.title')}</h1>
            
            <div className="comments-list">
                {comments.length === 0 ? (
                    <p style={{textAlign: 'center', color: '#666'}}>{t("comments.NoComments")}</p>
                ) : (
                    comments.map((c) => (
                        <div key={c.id} className="comment-item" onClick={() => startEditing(c)}>
                            <div className="comment-header">
                                <span 
                                    className="comment-author"
                                    onMouseEnter={(e) => handleAuthorHover(e, c.user_id)}
                                    onMouseMove={(e) => setTooltipPos({ x: e.clientX, y: e.clientY })}
                                    onMouseLeave={() => setHoveredUserId(null)}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <img className="comment-profile-picture" src={c.profile_picture_url} alt="" />
                                    {c.user_name || 'Utilisateur'}
                                </span>
                                <span className="comment-date">
                                    {/* Date logic remains the same */}
                                    {(() => {
                                        const diffInSeconds = Math.floor((new Date() - new Date(c.created_at)) / 1000);
                                        if (diffInSeconds < 60) return t('comments.instant');
                                        const diffInMinutes = Math.floor(diffInSeconds / 60);
                                        if (diffInMinutes < 60) return `${diffInMinutes} ${t('comments.minutes')}`;
                                        const diffInHours = Math.floor(diffInMinutes / 60);
                                        if (diffInHours < 24) return `${diffInHours} ${t('comments.hours')}`;
                                        return new Date(c.created_at).toLocaleDateString('fr-FR');
                                    })()}
                                </span>
                            </div>

                            {editingId === c.id ? (
                                <div className="edit-mode" onClick={(e) => e.stopPropagation()}>
                                    <textarea 
                                        className="comment-input"
                                        value={editText}
                                        onChange={(e) => setEditText(e.target.value)}
                                        autoFocus
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleUpdate(c.id);
                                            } else if (e.key === 'Escape') {
                                                setEditingId(null);
                                            }
                                        }}
                                    />
                                    <button 
                                        className="delete-icon-editing"
                                        title={t('comments.deleteComment')}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDelete(c.id);
                                        }}
                                    >
                                        <Trash2 size={18} color="#ff4444" />
                                    </button>
                                    <small style={{ color: '#666', fontSize: '0.7rem', display: 'block', marginTop: '5px' }}>
                                        {t('comments.enterToSave')}, {t('comments.escapeToCancel')}
                                    </small>
                                </div>
                            ) : (
                                <p className="comment-text">{c.content}</p>
                            )}
                        </div>
                    ))
                )}
            </div>

            <form onSubmit={handleSubmit} className="comment-form">
                <input name="comment" type="text" className="comment-input" placeholder={t('comments.addComment')} required />
                <button type="submit" className="comment-submit">{t('comments.submit')}</button>
            </form>

            {hoveredUserId && authorInfo && (
                <div className="author-tooltip-global" style={{ top: tooltipPos.y + 5, left: tooltipPos.x + 5 }}>
                    <img className="comment-profile-picture" src={authorInfo.profile_picture_url} alt="" />
                    <p><strong>{authorInfo.username}</strong></p>
                    <p>{authorInfo.email}</p>
                </div>
            )}
        </div>
    );
}

export default Comment;
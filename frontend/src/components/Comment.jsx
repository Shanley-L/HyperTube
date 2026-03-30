import { useState, useEffect } from "react";
import api from "../services/api";
import { Trash2 } from 'lucide-react';
import { useTranslation } from "react-i18next";

const movieId = 123456;

function Comment() {
    const { t } = useTranslation();
    const [comments, setComments] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [editText, setEditText] = useState("");

    // 🔥 NOUVEAU STATE
    const [hoveredUserId, setHoveredUserId] = useState(null);
    const [authorInfo, setAuthorInfo] = useState(null);
    const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 }); // Position de la souris

    useEffect(() => {
        const fetchComments = async () => {
            const response = await api.get('/comments/' + movieId);
            setComments(response.data);
        };
        fetchComments();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const response = await api.post('/comments', {
            movieId: movieId,
            comment: e.target.comment.value,
        });

        setComments([response.data, ...comments]);
        e.target.reset();
    };

    const startEditing = (comment) => {
        setEditingId(comment.id);
        setEditText(comment.content);
    };

    const handleUpdate = async (id) => {
        if (!editText.trim()) return setEditingId(null);

        try {
            await api.put('/comments/' + id, { comment: editText });
            setComments(comments.map((c) =>
                c.id === id ? { ...c, content: editText } : c
            ));
            setEditingId(null);
        } catch (error) {
            console.error('Error updating comment:', error);
        }
    };

    // 🔥 HOVER USER (style Discord)
    const handleAuthorHover = async (e, userId) => {
        if (hoveredUserId === userId) return;

        try {
            const response = await api.get('/users/' + userId);

            setAuthorInfo(response.data);
            setHoveredUserId(userId);

            // 📍 position souris
            setTooltipPos({
                x: e.clientX,
                y: e.clientY
            });

        } catch (error) {
            console.error('Error fetching user:', error);
        }
    };

    const handleMouseLeave = () => {
        setHoveredUserId(null);
    };

    const handleDelete = async (id) => {
        try {
            await api.delete('/comments/' + id);
            setComments(comments.filter((c) => c.id !== id));
        } catch (error) {
            console.error('Error deleting comment:', error);
        }
    };

    return (
        <div className="comments-section">
            <h1 className="comments-title">{t('comments.title')}</h1>

            <div className="comments-list">
                {comments.map((c) => (
                    <div
                        key={c.id}
                        className="comment-item"
                        onClick={() => startEditing(c)}
                    >
                        <div className="comment-header">
                            <span
                                className="comment-author"
                                onMouseEnter={(e) => handleAuthorHover(e, c.user_id)}
                                onMouseMove={(e) =>
                                    setTooltipPos({ x: e.clientX, y: e.clientY })
                                }
                                onMouseLeave={handleMouseLeave}
                                onClick={(e) => e.stopPropagation()}
                            >
                                {c.user_name || 'Utilisateur'}
                            </span>

                            <span className="comment-date">
                                {(() => {
                                    const diffInSeconds = Math.floor((new Date() - new Date(c.created_at)) / 1000);

                                    if (diffInSeconds < 60) return t('comments.instant');

                                    const diffInMinutes = Math.floor(diffInSeconds / 60);
                                    if (diffInMinutes < 60)
                                        return diffInMinutes === 1
                                            ? `${diffInMinutes} ${t('comments.minute')}`
                                            : `${diffInMinutes} ${t('comments.minutes')}`;

                                    const diffInHours = Math.floor(diffInMinutes / 60);
                                    if (diffInHours < 24)
                                        return diffInHours === 1
                                            ? `${diffInHours} ${t('comments.hour')}`
                                            : `${diffInHours} ${t('comments.hours')}`;

                                    return new Date(c.created_at).toLocaleDateString('fr-FR');
                                })()}
                            </span>
                        </div>

                        {editingId === c.id ? (
                            <div
                                className="edit-mode"
                                onClick={(e) => e.stopPropagation()}
                            >
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

                                <small style={{
                                    color: '#666',
                                    fontSize: '0.7rem',
                                    display: 'block',
                                    marginTop: '5px'
                                }}>
                                    {t('comments.enterToSave')}, {t('comments.escapeToCancel')}
                                </small>
                            </div>
                        ) : (
                            <p className="comment-text">{c.content}</p>
                        )}
                    </div>
                ))}
            </div>

            <form onSubmit={handleSubmit} className="comment-form">
                <input
                    name="comment"
                    type="text"
                    className="comment-input"
                    placeholder={t('comments.addComment')}
                    required
                />
                <button type="submit" className="comment-submit">
                    {t('comments.submit')}
                </button>
            </form>

            {/* 🔥 TOOLTIP - PAR-DESSUS */}
            {hoveredUserId && authorInfo && (
                <div
                    className="author-tooltip-global"
                    style={{
                        top: tooltipPos.y + 5,
                        left: tooltipPos.x + 5
                    }}
                >
                    <p><strong>{authorInfo.username}</strong></p>
                    <p>{authorInfo.email}</p>
                </div>
            )}
        </div>
    );
}

export default Comment;
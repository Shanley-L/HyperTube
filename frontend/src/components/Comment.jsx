import { useState, useEffect } from "react";
import api from "../services/api";
import { Trash2, Edit3, Send, XCircle } from 'lucide-react';

const movieId = 123456;


function Comment() {
    const [comments, setComments] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [editText, setEditText] = useState("");

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

    // 2. Pour sauvegarder via la touche Entrée (ton handleUpdate)
    const handleUpdate = async (id) => {
        if (!editText.trim()) return setEditingId(null);
        try {
            await api.put('/comments/' + id, { comment: editText });
            setComments(comments.map((c) => c.id === id ? { ...c, content: editText } : c));
            setEditingId(null);
        } catch (error) {
            console.error('Error updating comment:', error);
        }
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
            <h1 className="comments-title">Commentaires</h1>
            
            <div className="comments-list">
                {comments.map((c) => (
                    <div key={c.id} className="comment-item" onClick={() => startEditing(c)}>
                        <div className="comment-header">
                            <span className="comment-author">{c.user_name || 'Utilisateur'}</span>
                            <span className="comment-date">
                                {(() => {
                                    const diffInSeconds = Math.floor((new Date() - new Date(c.created_at)) / 1000);
                                    
                                    if (diffInSeconds < 60) return "À l'instant";
                                    
                                    const diffInMinutes = Math.floor(diffInSeconds / 60);
                                    if (diffInMinutes < 60) return `Il y a ${diffInMinutes} min`;
                                    
                                    const diffInHours = Math.floor(diffInMinutes / 60);
                                    if (diffInHours < 24) return `Il y a ${diffInHours} h`;
                                    
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
                                    className="delete-icon-editing" // Nouvelle classe CSS dédiée
                                    title="Supprimer définitivement"
                                    onClick={(e) => {
                                        e.stopPropagation(); // Évite de fermer l'édition
                                        handleDelete(c.id);  // Appelle votre fonction de suppression existante
                                    }}
                                >
                                    <Trash2 size={18} color="#ff4444" />
                                </button>

                                <small style={{ color: '#666', fontSize: '0.7rem', display: 'block', marginTop: '5px' }}>
                                    Enter to save, Escape to cancel
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
                    placeholder="Ajouter un commentaire"
                    required 
                />
                <button type="submit" className="comment-submit">Envoyer</button>
            </form>
        </div>  
    );
}

export default Comment;
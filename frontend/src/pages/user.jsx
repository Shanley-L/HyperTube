import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import './users.css';
import api from "../services/api";

export default function UserPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await api.get(`/users/${id}`);
                setUser(response.data);
            } catch (error) {
                console.error("Erreur lors de la récup du user:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchUserData();
    }, [id]);

    if (!user) return (
        <div className="users-page">
            <div className="user-profile">
                <button onClick={() => navigate('/users')} className="search-btn">Back</button>
                <div className="not-found">
                    <p className="not-found-404">404</p>
                    <p className="not-found-text">User not found.</p>
                </div>
            </div>
        </div>
    );

    return (
        <div className="users-page">
            <h1>User Profile</h1>
            <div className="user-profile">
                <button onClick={() => navigate('/users')} className="search-btn">Back</button>
                <img 
                    src={user.profile_picture_url || '/avatar-silhouette.svg'} 
                    className="user-avatar" 
                    alt="avatar"
                />
                <div className="user-name">{user.username}</div>
                {user.created_at && (
                    <div className="user-registered">
                        Registered since {user.created_at.slice(0, 10).split('-').reverse().join('/')}
                    </div>
                )}
            </div>
        </div>
    );
}
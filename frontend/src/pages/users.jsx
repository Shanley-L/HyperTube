import { useEffect, useState } from "react";
import './users.css';
import api, { isApiFailure } from "../services/api";
import { useNavigate } from "react-router-dom";
import { UserRoutes } from "../../../backend/config/resourceNames";
import { resolveAvatarUrl } from "../utils/avatar";

export default function UsersPage() {

    const navigate = useNavigate();
    const [users, setUsers] = useState([]);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        const response = await api.get(UserRoutes.USERS);
        if (!isApiFailure(response) && Array.isArray(response.data)) {
            setUsers(response.data);
        }
    };

    const handleUserClick = (user) => {
        navigate(`/user/${user.id}`);
    };

    return (
    <div className="users-page">
        <h1>{"Users from the community"}</h1>


        <ul className="users-grid">
            {users.map((user) => (
            <li key={user.id} className="user-card" onClick={() => handleUserClick(user)}>
                <img src={resolveAvatarUrl(user.profile_picture_url)} className="user-avatar" alt="avatar" />
                <div className="user-name">{user.username}</div>
            </li>
            ))}
        </ul>
    </div>
    );
}

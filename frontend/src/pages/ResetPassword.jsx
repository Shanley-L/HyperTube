import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../services/api";

import { useState } from "react";

const ResetPasswordForm = () => {
    const navigate = useNavigate();
    const [SearchParams] = useSearchParams()
    const token = SearchParams.get('token');

    const [invalidToken, setInvalidToken] = useState(false);

    const [formData, setFormData] = useState({newPassword: '', confirmPassword: ''});

    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.newPassword !== formData.confirmPassword) {
            return setError("Passwords doesnt match.")
        }

        try {
            const response = await api.post('auth/reset-password', {
                ...formData,
                token: token
            })
            if (response.status === 200) navigate('/login');
            if (response.status === 404) setInvalidToken(true);
        } catch (error) {
            if (error.response && error.response.status === 404) {
                setInvalidToken(true);
            }
        }
    }

    if (invalidToken === true) {
        return (
            <div className="form-container">
                <h3>Link has expired</h3>
                <a href="/login">please ask again.</a>
            </div>
        )
    }

    return (
        <div className="form-container">
            <h3>New password</h3>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <form onSubmit={handleSubmit}>
                <input 
                    type="password" 
                    name="newPassword" 
                    placeholder="New Password" 
                    onChange={handleChange} 
                    required 
                />
                <input 
                    type="password" 
                    name="confirmPassword" 
                    placeholder="Confirm Password" 
                    onChange={handleChange} 
                    required 
                />
                <button type="submit">Envoyer</button>
            </form>
        </div>
    )
}

export default ResetPasswordForm;
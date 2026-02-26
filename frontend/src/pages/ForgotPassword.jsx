import api from "../services/api";

import { useState } from "react";

const ResetPasswordForm = () => {
    const [isSubmitted, setIsSubmitted] = useState(false);

    const [formData, setFormData] = useState({email: ''});

    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const response = await api.post('auth/forgot-password', formData)
            if (response.status == 200) setIsSubmitted(true);
        } catch (error) {
            console.log(error)
        }
    }

    if (isSubmitted) {
        return (
            <div className="form-container">
                <h3>An email has been sent to reset your password.</h3>
                <a href="/login">No email ? please ask again and check your email adress.</a>
            </div>
        )
    }

    return (
        <div className="form-container">
            <h3>Add your email to get your reset password link</h3>
            <form onSubmit={handleSubmit}>
                <input type="email" name="email" placeholder="Email" onChange=
                {handleChange} required />
                <button type="submit">Envoyer</button>
            </form>
        </div>   
    )
}

export default ResetPasswordForm;
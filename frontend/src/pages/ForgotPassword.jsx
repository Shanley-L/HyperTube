import api from "../services/api";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({ email: '' });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    if (error) {
      setError('');
    }
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await api.post('auth/forgot-password', formData)
      if (response.status === 200) setIsSubmitted(true);
    } catch (err) {
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError(t('forgotPassword.networkError'));
      }
    }
  }

  if (isSubmitted) {
    return (
      <div className="forgot-password-page-wrapper">
        <div className="forgot-password-page">
          <h3>{t('forgotPassword.emailSent')}</h3>
          <Link to="/login">{t('forgotPassword.askAgain')}</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="forgot-password-page-wrapper">
      <div className="forgot-password-page">
        <h3>{t('forgotPassword.prompt')}</h3>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <input type="email" name="email" placeholder={t('forgotPassword.emailPlaceholder')} onChange={handleChange} required />
          <button type="submit">{t('forgotPassword.submit')}</button>
        </form>
        <p><Link to="/login">{t('forgotPassword.backToLogin')}</Link></p>
      </div>
    </div>
  )
}

export default ForgotPasswordPage;

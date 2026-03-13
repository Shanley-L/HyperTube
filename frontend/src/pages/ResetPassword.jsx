import { useNavigate, useSearchParams, Link } from "react-router-dom";
import api from "../services/api";
import { useState } from "react";
import { useTranslation } from "react-i18next";

function ResetPasswordPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [invalidToken, setInvalidToken] = useState(false);
  const [formData, setFormData] = useState({ newPassword: '', confirmPassword: '' });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (formData.newPassword !== formData.confirmPassword) {
      return setError(t('resetPassword.mismatch'))
    }
    try {
      const response = await api.post('auth/reset-password', {
        ...formData,
        token: token
      })
      if (response.status === 200) navigate('/login');
      if (response.status === 404) setInvalidToken(true);
    } catch (err) {
      if (err.response && err.response.status === 404) {
        setInvalidToken(true);
      }
    }
  }

  if (invalidToken === true) {
    return (
      <div className="form-container">
        <h3>{t('resetPassword.expired')}</h3>
        <Link to="/forgot-password">{t('resetPassword.askAgain')}</Link>
      </div>
    )
  }

  return (
    <div className="form-container">
      <h3>{t('resetPassword.newPasswordTitle')}</h3>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <input
          type="password"
          name="newPassword"
          placeholder={t('resetPassword.newPasswordPlaceholder')}
          onChange={handleChange}
          required
        />
        <input
          type="password"
          name="confirmPassword"
          placeholder={t('resetPassword.confirmPlaceholder')}
          onChange={handleChange}
          required
        />
        <button type="submit">{t('resetPassword.submit')}</button>
      </form>
      <p><Link to="/login">{t('resetPassword.backToLogin')}</Link></p>
    </div>
  )
}

export default ResetPasswordPage;

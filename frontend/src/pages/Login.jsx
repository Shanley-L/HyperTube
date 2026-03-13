import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import PosterBackground from "../components/PosterBackground";

function LoginPage() {
  const { t } = useTranslation();
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({})

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setFieldErrors({});

    try {
      const response = await api.post('/auth/login', formData);
      if (response.status === 200 && response.data.token) {
        login(response.data.token);
        navigate(location.state?.from || '/movies');
      }
    } catch (error) {
      if (error.response?.data?.errors) {
        const errors = {};
        error.response.data.errors.forEach((err) => {
          errors[err.path] = err.msg;
        });
        setFieldErrors(errors);
      } else if (error.response?.data?.message) {
        setError(error.response?.data?.message);
      } else {
        setError(t('login.networkError'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <PosterBackground>
      <div className="login-page">
          <h1>{t('login.title')}</h1>
          {error && <div className="error-message">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="username">{t('login.username')}</label>
              <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              required
              disabled={loading}
              className={fieldErrors.username ? 'error' : ''}
              />
              {fieldErrors.username && <div className="error-message">{fieldErrors.username}</div>}
            </div>
            <div className="form-group">
              <label htmlFor="password">{t('login.password')}</label>
              <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              disabled={loading}
              className={fieldErrors.password ? 'error' : ''}
              />
              {fieldErrors.password && <div className="error-message">{fieldErrors.password}</div>}
            </div>
            <button type="submit" disabled={loading}>
              {loading ? t('login.loggingIn') : t('login.submit')}
            </button>
          </form>

          <p>{t('login.noAccount')} <Link to="/register">{t('login.register')}</Link></p>
          <p>{t('login.forgotPassword')} <Link to="/forgot-password">{t('login.resetPassword')}</Link></p>
          <div className="oauth-section">
            <a href={`${import.meta.env.VITE_BACKEND_URL}/api/auth/google`}>
              <button className="oauth-button" type="button">
                <img src={"./src/assets/google.png"} alt={t('login.googleAlt')}/>
              </button>
            </a>
            <a href={`${import.meta.env.VITE_BACKEND_URL}/api/auth/42`}>
              <button className="oauth-button" type="button">
                <img src={"./src/assets/42.png"} alt={t('login.fortyTwoAlt')} />
              </button>
            </a>
            <a href={`${import.meta.env.VITE_BACKEND_URL}/api/auth/github`}>
              <button className="oauth-button" type="button">
                <img src={"./src/assets/github-logo.webp"} alt={t('login.githubAlt')} />
              </button>
            </a>
          </div>
        </div>
      </PosterBackground>
  );
}

export default LoginPage;

import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({})

//   useEffect(() => {
//     if (isAuthenticated) {
//       navigate('/movies');
//     }
//   }, [isAuthenticated, navigate]);

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
        navigate('/movies');
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
        setError(' Login failed due to a network error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
        <h1>Login</h1>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
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
            <label htmlFor="password">Password</label>
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
          <button type="submit">Login
           {loading ? 'logging in...' : ''}
           </button>
        </form>

        <p>Don't have an account? <Link to="/register">Register</Link></p>
        <p>Forgot your password? <Link to="/forgot-password">Reset Password</Link></p>
        <div className="oauth-section">
          <a href={`${import.meta.env.VITE_BACKEND_URL}/api/auth/google`}>
            <button className="oauth-button">
              <img src={"./src/assets/google.png"} alt="Login with Google"/>
            </button>
          </a>
          <a href={`${import.meta.env.VITE_BACKEND_URL}/api/auth/42`}>
            <button className="oauth-button">
              <img src={"./src/assets/42.png"} alt="Login with 42" />
            </button>
          </a>
        </div>
      </div>
  );
}

export default LoginPage;
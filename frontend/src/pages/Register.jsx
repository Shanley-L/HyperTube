import api from "../services/api";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import PosterBackground from "../components/PosterBackground";

function RegisterPage() {
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    first_name: '',
    last_name: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const navigate = useNavigate();


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

    try{
      const response = await api.post('/auth/register', formData);
      if (response.status === 201) navigate('/login');
      else if (response.status === 400) {
        const errors = {};
        response.data.errors.forEach((err) => {
          const field = err.param ?? err.path;
          if (field) errors[field] = err.msg;
        });
        setFieldErrors(errors);
      } else {
        setError('Registration failed due to a network error');
      }
    } catch (error) {
      if (error.response?.data?.errors) {
        const errors = {};
        error.response.data.errors.forEach((err) => {
          const field = err.param ?? err.path;
          if (field) errors[field] = err.msg;
        });
        setFieldErrors(errors);
      } else if (error.response?.data?.message) {
        setError(error.response?.data?.message);
      } else {
        setError('Registration failed due to a network error');
      }
    }
    finally {
      setLoading(false);
    }
  };

  return (
    <PosterBackground>
      <div className="register-page">
        <h1>Register</h1>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input type="email" id="email" name="email" value={formData.email} onChange={handleInputChange} required disabled={loading} className={fieldErrors.email ? 'error' : ''} />
            {fieldErrors.email && <div className="error-message">{fieldErrors.email}</div>}
          </div>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input type="text" id="username" name="username" value={formData.username} onChange={handleInputChange} required disabled={loading} className={fieldErrors.username ? 'error' : ''} />
            {fieldErrors.username && <div className="error-message">{fieldErrors.username}</div>}
          </div>
          <div className="form-group">
            <label htmlFor="first_name">First Name</label>
            <input type="text" id="first_name" name="first_name" value={formData.first_name} onChange={handleInputChange} required disabled={loading} className={fieldErrors.first_name ? 'error' : ''} />
            {fieldErrors.first_name && <div className="error-message">{fieldErrors.first_name}</div>}
          </div>
          <div className="form-group">
            <label htmlFor="last_name">Last Name</label>
            <input type="text" id="last_name" name="last_name" value={formData.last_name} onChange={handleInputChange} required disabled={loading} className={fieldErrors.last_name ? 'error' : ''} />
            {fieldErrors.last_name && <div className="error-message">{fieldErrors.last_name}</div>}
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input type="password" id="password" name="password" value={formData.password} onChange={handleInputChange} required disabled={loading} className={fieldErrors.password ? 'error' : ''} />
            {fieldErrors.password && <div className="error-message">{fieldErrors.password}</div>}
          </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Registering...' : 'Register'}
        </button>
        </form>
        <div className="login-link">
            <Link to="/login"><h2>Already have an account?</h2></Link>
        </div>
      </div>
    </PosterBackground>
  );
}

export default RegisterPage
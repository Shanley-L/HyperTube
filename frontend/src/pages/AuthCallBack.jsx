import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';

function AuthCallBackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      login(token);
      navigate('/', { replace: true });
    } else {
      navigate('/login', { replace: true });
    }
  }, [searchParams, login, navigate]);

  return null;
}

export default AuthCallBackPage;

import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";

function LoginPage() {
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const response = await api.post('/auth/login', {username, password});
    if (response.status === 200) {
      login(response.data.token);
      navigate('/');
    } else {
      setError(response.data.message);
    }
  };

  return (
    <div>
        <h1>Login</h1>
        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="username">Username</label>
            <input type="text" id="username" name="username" required />
          </div>
          <div>
            <label htmlFor="password">Password</label>
            <input type="password" id="password" name="password" required />
          </div>
          <button type="submit">Login</button>
        </form>
    </div>
  );
}

export default LoginPage;
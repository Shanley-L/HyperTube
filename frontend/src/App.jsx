import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext.jsx';
import LoginPage from './pages/Login.jsx';
import RegisterPage from './pages/Register.jsx'
import ForgotPasswordPage from './pages/ForgotPassword.jsx';
import ResetPasswordPage from './pages/ResetPassword.jsx';
import MoviesPages from './pages/movies.jsx';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app">
          <header>
            <h1>HyperTube</h1>
          </header>
          <main>
            <Routes>
              <Route path="/" element={<div>Home Page</div>} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              {/* <Route path="/email-confirmation" element={<EmailConfirmation />} /> */}
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/movies" element={<MoviesPages />} />
              {/* <Route path="/profile" element={<ProfilePage />} /> */}
              {/* <Route path="/logout" element={<LogoutPage />} /> */}
              {/* <Route path="/auth/callback" element={<AuthCallbackPage />} /> */}
            </Routes>
          </main>
          <footer>
          </footer>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;

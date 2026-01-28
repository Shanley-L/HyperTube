import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext.jsx';
import LoginPage from './pages/Login.jsx';

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
              {/* <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/logout" element={<LogoutPage />} />
              <Route path="/auth/callback" element={<AuthCallbackPage />} /> */}
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

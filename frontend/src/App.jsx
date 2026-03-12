import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext.jsx';
import LoginPage from './pages/Login.jsx';
import RegisterPage from './pages/Register.jsx'
import MoviePage from './pages/Movie.jsx';
import ForgotPasswordPage from './pages/ForgotPassword.jsx';
import ResetPasswordPage from './pages/ResetPassword.jsx';
import MoviesPages from './pages/movies.jsx';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import AuthCallBackPage from './pages/AuthCallBack.jsx';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app">
          <Header/>
          <main>
            <div className="main-routes">
            <Routes>
              <Route path="/" element={<div>Home Page</div>} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
			  <Route path="/movie/:id" element={<MoviePage />} />
              {/* <Route path="/forgot-password" element={<ForgotPasswordPage />} /> */}
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              {/* <Route path="/email-confirmation" element={<EmailConfirmation />} /> */}
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/movies" element={<MoviesPages />} />
              {/* <Route path="/profile" element={<ProfilePage />} /> */}
              <Route path="/auth/callback" element={<AuthCallBackPage />} />
            </Routes>
            </div>
          </main>
          <Footer/>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;

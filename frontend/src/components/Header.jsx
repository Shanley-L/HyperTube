import { useAuth } from "../contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import ProfileModal from "./ProfilModal.jsx";
import { avatarSrcWithBust } from "../utils/avatar";

function Header() {
  const { t, i18n } = useTranslation();
  const { user, logout, isAuthenticated, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const publicPaths = ['/login', '/register', '/movies', '/forgot-password', '/reset-password', '/auth/callback', '/'];
  useEffect(() => {
    const isPublicRoute = publicPaths.includes(location.pathname);
    if (!isAuthenticated && !isPublicRoute) {
      navigate('/login');
    } else if (isAuthenticated && (location.pathname === '/login' || location.pathname === '/register')) {
      navigate('/movies');
    }
  }, [isAuthenticated, location.pathname, navigate]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target))
        setDropdownOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogoutClick = () => {
    setDropdownOpen(false);
    logout();
    navigate('/login');
  };

  const handleProfileClick = () => {
    setDropdownOpen(false);
    setIsProfileModalOpen(true);
  };

  const setLang = (lng) => {
    i18n.changeLanguage(lng);
  };

  const langButtons = (className) => (
    <div className={className} role="group" aria-label="Language">
      <button type="button" onClick={() => setLang('en')} className={i18n.language.startsWith('en') ? 'header-lang-active' : ''}>{t('header.langEn')}</button>
      <span className="header-lang-sep">|</span>
      <button type="button" onClick={() => setLang('fr')} className={i18n.language.startsWith('fr') ? 'header-lang-active' : ''}>{t('header.langFr')}</button>
    </div>
  );

  return (
    <header>
      <h1><button
        className="header-title-button"
        type="button"
        onClick={() => navigate('/movies')}
        style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '2rem', color: 'white' }}
      >
        Hyper
        <span style={{ backgroundColor: '#FF8C00', color: 'black', padding: '2px 8px', borderRadius: '6px', marginLeft: '2px' }}>
          Tube
        </span>
      </button></h1>
      <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {isAuthenticated || user ? (
          <>
            <div className="header-user-menu" ref={dropdownRef}>
              <button
                type="button"
                className="header-username-button header-user-trigger"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                aria-expanded={dropdownOpen}
                aria-haspopup="true"
              >
                <img
                  className="header-avatar"
                  src={avatarSrcWithBust(user?.profile_picture_url, user?.avatarBust)}
                  alt=""
                  width={32}
                  height={32}
                />
                <span>{t('header.hello', { username: user?.username ?? '' })}</span>
              </button>
              {dropdownOpen && (
                <div className="header-user-menu-dropdown">
                  <button type="button" onClick={handleProfileClick}>{t('header.profile')}</button>
                  <div className="header-user-menu-dropdown-lang">
                    {langButtons('header-lang-row')}
                  </div>
                </div>
              )}
            </div>
            <button
              type="button"
              className="header-logout-icon"
              onClick={handleLogoutClick}
              aria-label={t('header.logout')}
              title={t('header.logout')}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </>
        ) : (
          <>
            {location.pathname === '/movies' && (
              <button
                type="button"
                className="header-login-button"
                onClick={() => navigate('/login')}
              >
                {t('header.login')}
              </button>
            )}
            {langButtons('header-lang header-lang-standalone')}
          </>
        )}
      </div>
      {isProfileModalOpen && (
        <ProfileModal
          onClose={() => { setIsProfileModalOpen(false); refreshProfile(); }}
          onSuccess={() => { setIsProfileModalOpen(false); refreshProfile(); }}
        />
      )}
    </header>
  );
}

export default Header;

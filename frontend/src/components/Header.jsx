import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import ProfileModal from "./ProfilModal.jsx";



function Header() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!user && location.pathname !== '/login' && location.pathname !== '/register') {
      navigate('/login');
    }
    console.log(location.pathname);
    console.log(user);
  }, [user, navigate]);
  
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.currentcontains(event.target))
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

  const handleProfileClose = () => {
    setIsProfileModalOpen(false);
  };

  return (
    <header>
      <h1><button className="header-title-button" type="button" onClick={() => navigate('/movies')}>HyperTube</button></h1>
      <div className="header-right">
        {isAuthenticated || user ? (
          <div className="header-user-menu" ref={dropdownRef}>
            <button
              type="button"
              className="header-username-button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              aria-expanded={dropdownOpen}
              aria-haspopup="true"
            >
              Hello, {user?.username}
            </button>
            {dropdownOpen && (
              <div className="header-user-menu-dropdown">
                <button
                  type="button"
                  onClick={handleProfileClick}
                >Profile</button>
                <button
                  type="button"
                  onClick={handleLogoutClick}
                >Logout</button>
              </div>
            )}
          </div>
        ) : ("")}
      </div>
      {isProfileModalOpen && (<ProfileModal onClose={() => setIsProfileModalOpen(false)} onSuccess={() => setIsProfileModalOpen(false)} />)}
    </header>
  );
}

export default Header;
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import ProfileModal from "./ProfileModal.jsx";


function Header() {
  const { user, logout, isAuthenticated } = useAuth();
  return (
    <header>
      <h1>HyperTube</h1>
      <div className="header-right">
        {isAuthenticated || user ? (
          <>
            <span>Hello, {user?.username}</span>
            <button onClick={logout}>Logout</button>
          </>
        ) : ("not logged in")}
      </div>

    </header>
  );
}

export default Header;
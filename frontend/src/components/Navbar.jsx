import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import React from "react";

export default function Navbar() {
  const { user, logout, theme, setTheme } = useAuth();
  const navigate = useNavigate();
  const initials = (user?.name || "U").slice(0, 1).toUpperCase();

  return (
    <nav className="navbar">
      <Link to="/dashboard" className="brand-link">
        <span className="brand-mark">◆</span>
        <span>Task<span>Forge</span></span>
      </Link>

      <div className="nav-links">
        <NavLink to="/dashboard">Workspace</NavLink>
        <NavLink to="/analytics">Analytics</NavLink>
        <NavLink to="/profile">Profile</NavLink>
      </div>

      <div className="nav-actions">
        <button className="icon-btn" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} title="Toggle theme">
          {theme === "dark" ? "☼" : "☾"}
        </button>
        <button className="user-chip" onClick={() => navigate("/profile")}>
          <span className="avatar-mini">{initials}</span>
          <span className="user-chip-text">{user?.name || "User"}</span>
        </button>
        <button className="logout-btn" onClick={() => { logout(); navigate("/login"); }}>Logout</button>
      </div>
    </nav>
  );
}

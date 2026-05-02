/**
 * src/components/Navbar.js — Top Navigation Bar (Admin)
 *
 * A clean horizontal navbar shown on all admin pages.
 * Links: Live Map | Teams | Assign Task | (Logout)
 *
 * Uses React Router's NavLink so the active page is highlighted.
 */

import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      {/* Brand */}
      <div className="navbar-brand">
        <span className="navbar-logo">🚨</span>
        <span className="navbar-title">Disaster Response</span>
      </div>

      {/* Navigation links */}
      <div className="navbar-links">
        <NavLink
          to="/admin-map"
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          🗺 Live Map
        </NavLink>
        <NavLink
          to="/admin-teams"
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          🚑 Teams
        </NavLink>
        <NavLink
          to="/assign-task"
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          🎯 Assign Task
        </NavLink>
      </div>

      {/* Right: user info + logout */}
      <div className="navbar-right">
        <span className="navbar-user">
          👤 {user?.name || 'Admin'}
        </span>
        <button className="btn btn-danger navbar-logout" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;

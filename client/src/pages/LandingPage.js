/**
 * src/pages/LandingPage.js — Home / Entry Page
 *
 * Shows two clear options:
 *   1. Admin Login
 *   2. Rescue Team Login
 *
 * This avoids a single confusing login page for different roles.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      {/* Background decorative blobs */}
      <div className="landing-blob landing-blob-1"></div>
      <div className="landing-blob landing-blob-2"></div>

      <div className="landing-content">
        {/* Header */}
        <div className="landing-header">
          <div className="landing-icon">🚨</div>
          <h1>Disaster Response Dashboard</h1>
          <p>
            Real-Time Tracking and Coordination of Rescue Teams and Relief Vehicles
          </p>
        </div>

        {/* Two role cards */}
        <div className="landing-cards">
          {/* Admin Card */}
          <div className="role-card role-card-admin" onClick={() => navigate('/admin-login')}>
            <div className="role-card-icon">🛡️</div>
            <h2>Command Center</h2>
            <p>
              Monitor all teams live, assign missions, track locations, and manage operations.
            </p>
            <div className="role-features">
              <span>📍 Live map of all teams</span>
              <span>🎯 Assign missions</span>
              <span>📋 Task management</span>
            </div>
            <button className="btn btn-primary role-btn">
              Admin Login →
            </button>
          </div>

          {/* Team Card */}
          <div className="role-card role-card-team" onClick={() => navigate('/team-login')}>
            <div className="role-card-icon">🚑</div>
            <h2>Rescue Team</h2>
            <p>
              Share your live location, view assigned missions, and update your operational status.
            </p>
            <div className="role-features">
              <span>📡 Live GPS sharing</span>
              <span>📋 View my mission</span>
              <span>👥 See other teams</span>
            </div>
            <button className="btn btn-success role-btn">
              Team Login →
            </button>
          </div>
        </div>

        {/* Register link */}
        <p className="landing-footer">
          New rescue team?{' '}
          <span className="link-btn" onClick={() => navigate('/signup')}>
            Register here
          </span>
        </p>
      </div>
    </div>
  );
};

export default LandingPage;

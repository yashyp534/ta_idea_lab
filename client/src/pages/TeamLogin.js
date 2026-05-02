/**
 * src/pages/TeamLogin.js — Rescue Team Login Page
 *
 * A dedicated login page for Rescue Team members.
 * Same backend API, but:
 *   - Shows team-themed UI
 *   - Validates role is 'team' (not admin)
 *   - Redirects to /team-dashboard on success
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const TeamLogin = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/login', { email, password });
      const { token, user } = res.data;

      // Extra check: only allow team members through this page
      if (user.role !== 'team') {
        setError('This login is for Rescue Teams only. Please use the Admin Login page.');
        setLoading(false);
        return;
      }

      login(user, token);
      navigate('/team-dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Left branding panel */}
      <div
        className="auth-brand-panel"
        style={{ background: 'linear-gradient(135deg, #052e16 0%, #0f172a 50%, #1a1f2e 100%)' }}
      >
        <div className="brand-content">
          <div className="brand-icon">🚑</div>
          <h1>Rescue Team Portal</h1>
          <p>
            Login to share your live GPS location, receive mission assignments, and update your operational status.
          </p>
          <div className="brand-features">
            <div className="brand-feature">
              <span className="feature-dot available"></span>
              Broadcast your GPS location
            </div>
            <div className="brand-feature">
              <span className="feature-dot on-mission"></span>
              Receive real-time missions
            </div>
            <div className="brand-feature">
              <span className="feature-dot busy"></span>
              See all teams on the map
            </div>
          </div>
          <div style={{ marginTop: '32px' }}>
            <Link to="/" style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>

      {/* Right: Login form */}
      <div className="auth-form-panel">
        <div className="auth-card">
          <div className="auth-header">
            <h2>Team Login</h2>
            <p>Sign in as a Rescue Team member</p>
          </div>

          {error && <div className="alert alert-error">⚠ {error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Team Email</label>
              <input
                type="email"
                className="form-input"
                placeholder="alpha@rescue.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-success btn-full"
              disabled={loading}
            >
              {loading ? <><span className="spinner"></span> Signing in...</> : '🚑 Login as Team'}
            </button>
          </form>

          <hr className="divider" />

          <p className="auth-switch">
            Don't have an account? <Link to="/signup">Register your team</Link>
          </p>
          <p className="auth-switch" style={{ marginTop: '8px' }}>
            Are you an admin? <Link to="/admin-login">Admin Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default TeamLogin;

/**
 * src/pages/AdminLogin.js — Admin-Only Login Page
 *
 * A dedicated login page for the Command Center (Admin).
 * Calls the same /api/auth/login endpoint but:
 *   - Shows admin-themed UI
 *   - Validates that the logged-in user actually has role 'admin'
 *   - Redirects to /admin-dashboard on success
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const AdminLogin = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email,    setEmail]    = useState('admin@rescue.com'); // Pre-fill for demo
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

      // Extra check: only allow admins through this page
      if (user.role !== 'admin') {
        setError('This login is for Admins only. Please use the Team Login page.');
        setLoading(false);
        return;
      }

      login(user, token);
      navigate('/admin-dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Left branding panel */}
      <div className="auth-brand-panel" style={{ background: 'linear-gradient(135deg, #1a2744 0%, #0f172a 50%, #1a1f2e 100%)' }}>
        <div className="brand-content">
          <div className="brand-icon">🛡️</div>
          <h1>Command Center</h1>
          <p>
            Login as Admin to monitor all rescue teams, assign missions, and manage operations in real time.
          </p>
          <div className="brand-features">
            <div className="brand-feature">
              <span className="feature-dot available"></span>
              Live map of all teams
            </div>
            <div className="brand-feature">
              <span className="feature-dot on-mission"></span>
              Assign missions with map click
            </div>
            <div className="brand-feature">
              <span className="feature-dot busy"></span>
              Set team location manually
            </div>
          </div>
          {/* Back to home */}
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
            <h2>Admin Login</h2>
            <p>Sign in to the Command Center</p>
          </div>

          {error && <div className="alert alert-error">⚠ {error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Admin Email</label>
              <input
                type="email"
                className="form-input"
                placeholder="admin@rescue.com"
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
                placeholder="Enter admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-full"
              disabled={loading}
            >
              {loading ? <><span className="spinner"></span> Signing in...</> : '🛡️ Login as Admin'}
            </button>
          </form>

          <hr className="divider" />

          <div className="demo-credentials">
            <p className="demo-title">Demo Credentials</p>
            <div className="demo-row">
              <strong>Email:</strong>
              <span>admin@rescue.com</span>
            </div>
            <div className="demo-row" style={{ marginTop: '6px' }}>
              <strong>Password:</strong>
              <span>admin123</span>
            </div>
            <p style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
              Run <code>POST /api/auth/seed-admin</code> first if not set up.
            </p>
          </div>

          <p className="auth-switch">
            Are you a rescue team? <Link to="/team-login">Team Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;

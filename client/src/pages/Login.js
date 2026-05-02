/**
 * src/pages/Login.js — Login Page
 * 
 * Allows both Admin and Rescue Team members to log in.
 * On success → navigates to the correct dashboard based on role.
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const Login = () => {
  const navigate = useNavigate();
  const { login }  = useAuth();

  // Form field state
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');

  // UI state
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  // ── handleSubmit ─────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default form submission (page reload)
    setError('');
    setLoading(true);

    try {
      // POST /api/auth/login with email + password
      const res = await api.post('/auth/login', { email, password });
      const { token, user } = res.data;

      // Save user + token to context + localStorage
      login(user, token);

      // Navigate to the correct dashboard based on role
      navigate(user.role === 'admin' ? '/admin' : '/team');
    } catch (err) {
      // Show the error message from the server (e.g., "Invalid email or password")
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Left panel — branding */}
      <div className="auth-brand-panel">
        <div className="brand-content">
          <div className="brand-icon">🚨</div>
          <h1>Disaster Response</h1>
          <p>Real-time coordination of rescue teams and relief vehicles during emergencies.</p>
          <div className="brand-features">
            <div className="brand-feature">
              <span className="feature-dot available"></span>
              Live team tracking
            </div>
            <div className="brand-feature">
              <span className="feature-dot busy"></span>
              Mission assignment
            </div>
            <div className="brand-feature">
              <span className="feature-dot on-mission"></span>
              Real-time status updates
            </div>
          </div>
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="auth-form-panel">
        <div className="auth-card">
          <div className="auth-header">
            <h2>Welcome Back</h2>
            <p>Sign in to the Disaster Response Dashboard</p>
          </div>

          {/* Error alert */}
          {error && <div className="alert alert-error">⚠ {error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
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
                placeholder="Enter your password"
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
              {loading ? <><span className="spinner"></span> Signing in...</> : 'Sign In'}
            </button>
          </form>

          <hr className="divider" />

          {/* Demo credentials helper */}
          <div className="demo-credentials">
            <p className="demo-title">Demo Credentials</p>
            <div className="demo-row">
              <strong>Admin:</strong>
              <span>admin@rescue.com / admin123</span>
            </div>
            <p style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
              Run <code>/api/auth/seed-admin</code> first to create the admin account.
            </p>
          </div>

          <p className="auth-switch">
            New rescue team member? <Link to="/signup">Create Account</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;

/**
 * src/pages/Signup.js — Rescue Team Registration Page (FIXED)
 * 
 * NEW: Now captures GPS location during signup so teams appear on map instantly.
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const Signup = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  // Form state
  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [teamType, setTeamType] = useState('Rescue Van'); // NEW: Team Type
  
  // New Location state
  const [lat,      setLat]      = useState('');
  const [lng,      setLng]      = useState('');

  // UI state
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  // FEATURE: "Use My Location" helper
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      return setError('Geolocation is not supported by your browser.');
    }
    setError('Getting location...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(6));
        setLng(pos.coords.longitude.toFixed(6));
        setError(''); // clear "getting location" message
      },
      (err) => {
        setError('Could not get location. Please enter manually.');
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirm) return setError('Passwords do not match.');
    if (password.length < 6)  return setError('Password must be at least 6 characters.');
    if (!lat || !lng)         return setError('Please provide your location.');

    setLoading(true);
    try {
      const res = await api.post('/auth/signup', { 
        name, 
        email, 
        password,
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        teamType // NEW: Send team type
      });
      
      const { token, user } = res.data;
      login(user, token);
      navigate('/team-dashboard'); // Redirect to dashboard
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-brand-panel">
        <div className="brand-content">
          <div className="brand-icon">🆘</div>
          <h1>Join the Response</h1>
          <p>Register as a rescue team member to receive real-time mission assignments.</p>
        </div>
      </div>

      <div className="auth-form-panel">
        <div className="auth-card">
          <div className="auth-header">
            <h2>Create Account</h2>
            <p>Rescue Team Registration</p>
          </div>

          {error && <div className={`alert ${error.includes('Getting') ? 'alert-info' : 'alert-error'}`}>⚠ {error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Team Name</label>
              <input type="text" className="form-input" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>

            <div className="form-group">
              <label className="form-label">Email</label>
              <input type="email" className="form-input" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input type="password" className="form-input" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>

            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input type="password" className="form-input" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
            </div>

            {/* TEAM TYPE SELECTION */}
            <div className="form-group">
              <label className="form-label">Rescue Unit Type</label>
              <select 
                className="form-input" 
                value={teamType} 
                onChange={(e) => setTeamType(e.target.value)}
                style={{ appearance: 'auto' }}
              >
                <option value="Ambulance">🚑 Ambulance</option>
                <option value="Fire Truck">🚒 Fire Truck</option>
                <option value="Police">🚓 Police</option>
                <option value="Rescue Van">🚐 Rescue Van</option>
              </select>
            </div>

            {/* LOCATION FIELDS */}
            <div className="location-signup-box" style={{ background: 'rgba(59, 130, 246, 0.05)', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <label className="form-label" style={{ margin: 0 }}>📍 Current Location</label>
                <button type="button" onClick={handleGetLocation} className="btn-text" style={{ fontSize: '12px', color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer' }}>
                  Use My GPS
                </button>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input type="number" step="any" placeholder="Latitude" className="form-input" value={lat} onChange={(e) => setLat(e.target.value)} required />
                <input type="number" step="any" placeholder="Longitude" className="form-input" value={lng} onChange={(e) => setLng(e.target.value)} required />
              </div>
            </div>

            <button type="submit" className="btn btn-success btn-full" disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="auth-switch">
            Already have an account? <Link to="/team-login">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;

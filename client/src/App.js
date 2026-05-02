/**
 * src/App.js — Root Router (UPDATED)
 *
 * New routes added:
 *   /              → LandingPage  (role-selection home)
 *   /admin-login   → AdminLogin   (admin-specific login)
 *   /team-login    → TeamLogin    (team-specific login)
 *   /admin-dashboard → AdminDashboard (protected, admin only)
 *   /team-dashboard  → TeamDashboard  (protected, team only)
 *
 * Old routes kept for backward compatibility:
 *   /login  → existing Login page
 *   /signup → existing Signup page
 *   /admin  → redirects to /admin-dashboard
 *   /team   → redirects to /team-dashboard
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// ── Pages ──────────────────────────────────────────────────────
import LandingPage    from './pages/LandingPage';
import AdminLogin     from './pages/AdminLogin';
import TeamLogin      from './pages/TeamLogin';
import Login          from './pages/Login';
import Signup         from './pages/Signup';
import AdminMap       from './pages/AdminMap';       // NEW
import AdminTeams     from './pages/AdminTeams';     // NEW
import AssignTaskPage from './pages/AssignTaskPage';  // NEW
import TeamDashboard  from './pages/TeamDashboard';

// ── ProtectedRoute Helper ──────────────────────────────────────
const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading } = useAuth();

  if (loading) return <div className="loader">Loading...</div>;
  if (!user) return <Navigate to="/" replace />;
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to={user.role === 'admin' ? '/admin-map' : '/team-dashboard'} replace />;
  }
  return children;
};

const App = () => {
  const { user } = useAuth();
  const dashboardPath = user
    ? (user.role === 'admin' ? '/admin-map' : '/team-dashboard')
    : null;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={user ? <Navigate to={dashboardPath} replace /> : <LandingPage />} />
        
        {/* Auth */}
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/team-login"  element={<TeamLogin />} />
        <Route path="/login"       element={<Login />} />
        <Route path="/signup"      element={<Signup />} />

        {/* ── Admin Dashboard Pages (Separate) ────────────────── */}
        <Route path="/admin-map" element={
          <ProtectedRoute requiredRole="admin"><AdminMap /></ProtectedRoute>
        } />
        <Route path="/admin-teams" element={
          <ProtectedRoute requiredRole="admin"><AdminTeams /></ProtectedRoute>
        } />
        <Route path="/assign-task" element={
          <ProtectedRoute requiredRole="admin"><AssignTaskPage /></ProtectedRoute>
        } />
        
        {/* Backward Compatibility Redirects */}
        <Route path="/admin-dashboard" element={<Navigate to="/admin-map" replace />} />
        <Route path="/admin"           element={<Navigate to="/admin-map" replace />} />

        {/* ── Team Dashboard ─────────────────────────────────── */}
        <Route path="/team-dashboard" element={
          <ProtectedRoute requiredRole="team"><TeamDashboard /></ProtectedRoute>
        } />
        <Route path="/team" element={<Navigate to="/team-dashboard" replace />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;

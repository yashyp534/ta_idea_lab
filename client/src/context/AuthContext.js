/**
 * src/context/AuthContext.js — Global Authentication State
 * 
 * This is a React Context that stores:
 *  - The logged-in user object (name, role, teamId, etc.)
 *  - Login and logout functions
 * 
 * Any component can call useAuth() to access this state.
 * The user data is persisted in localStorage so it survives page refreshes.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';

// Create the context object
const AuthContext = createContext(null);

// ── AuthProvider ──────────────────────────────────────────────
// Wrap the whole app in this so every component can access auth state
export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null);   // Logged-in user data
  const [token,   setToken]   = useState(null);   // JWT token
  const [loading, setLoading] = useState(true);   // True while reading localStorage

  // On first load, check if a user session exists in localStorage
  useEffect(() => {
    try {
      const savedUser  = localStorage.getItem('dr_user');
      const savedToken = localStorage.getItem('dr_token');
      if (savedUser && savedToken) {
        setUser(JSON.parse(savedUser));
        setToken(savedToken);
      }
    } catch {
      // If parsing fails, clear corrupted data
      localStorage.removeItem('dr_user');
      localStorage.removeItem('dr_token');
    } finally {
      setLoading(false); // Done loading regardless
    }
  }, []);

  // ── login ───────────────────────────────────────────────────
  // Called after a successful API login
  // Stores user + token in state AND localStorage
  const login = (userData, jwtToken) => {
    setUser(userData);
    setToken(jwtToken);
    localStorage.setItem('dr_user',  JSON.stringify(userData));
    localStorage.setItem('dr_token', jwtToken);
  };

  // ── logout ──────────────────────────────────────────────────
  // Clears all auth state and redirects to login
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('dr_user');
    localStorage.removeItem('dr_token');
  };

  // Provide the state and functions to all children
  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// ── useAuth Hook ──────────────────────────────────────────────
// Shortcut hook: call useAuth() instead of useContext(AuthContext)
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return context;
};

export default AuthContext;

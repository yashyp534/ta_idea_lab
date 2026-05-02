/**
 * src/services/api.js — Axios API Client
 * 
 * Creates a pre-configured Axios instance that:
 * 1. Points to our backend server (http://localhost:5000)
 * 2. Automatically attaches the JWT token to every request
 * 
 * Usage: import api from '../services/api';
 *        const res = await api.get('/teams');
 */

import axios from 'axios';

// Base URL for all API requests
// "proxy" in package.json handles this in development
const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request Interceptor ───────────────────────────────────────
// Runs before EVERY request is sent
// Reads the JWT token from localStorage and adds it as Authorization header
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('dr_token');
    if (token) {
      // This is how our server's protect() middleware reads the token
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response Interceptor ──────────────────────────────────────
// Runs after every response
// If we get a 401 (token expired), clear localStorage and redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('dr_user');
      localStorage.removeItem('dr_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

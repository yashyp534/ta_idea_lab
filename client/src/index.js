/**
 * src/index.js — React App Entry Point
 * 
 * Renders the root <App /> component into the #root div in index.html.
 * Wraps everything in <AuthProvider> so auth state is available everywhere.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';         // Global styles
import "leaflet/dist/leaflet.css"; // Leaflet Map styles (FIXES visible map issue)
import App from './App';
import { AuthProvider } from './context/AuthContext';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    {/* AuthProvider makes login state available to every component */}
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);

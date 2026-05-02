/**
 * src/components/Notification.js — Toast Notification Component
 * 
 * Shows a temporary alert message at the top of the screen.
 * Used for: "Task Assigned", "Status Updated", "Location Updated", errors, etc.
 * 
 * Props:
 *   message  (string)  — The text to show
 *   type     (string)  — 'success' | 'error' | 'info'
 *   onClose  (func)    — Called when the notification should disappear
 */

import React, { useEffect } from 'react';
import './Notification.css';

const ICONS = {
  success: '✅',
  error:   '⚠️',
  info:    'ℹ️',
};

const Notification = ({ message, type = 'info', onClose }) => {
  // Auto-dismiss after 4 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);

    // Cleanup: cancel timer if the component unmounts before 4s
    return () => clearTimeout(timer);
  }, [onClose]);

  if (!message) return null;

  return (
    <div className={`notification notification-${type}`}>
      <span className="notification-icon">{ICONS[type]}</span>
      <span className="notification-message">{message}</span>
      <button className="notification-close" onClick={onClose} aria-label="Close">
        ×
      </button>
    </div>
  );
};

export default Notification;

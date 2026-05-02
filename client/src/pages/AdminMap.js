/**
 * src/pages/AdminMap.js — Admin Tracking Dashboard (FIXED)
 * 
 * FIXES:
 * 1. Auto-refresh teams every 5 seconds (setInterval)
 * 2. Full-screen map rendering
 * 3. Real-time marker updates
 */

import React, { useState, useEffect } from 'react';
import api from '../services/api';
import socket from '../services/socket';
import MapView from '../components/MapView';
import Navbar from '../components/Navbar';
import Notification from '../components/Notification';
import './AdminMap.css';

const AdminMap = () => {
  const [teams, setTeams] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [notification, setNotification] = useState(null);

  // ── FEATURE 5: FETCH AND REFRESH TEAMS ────────────────────────
  const fetchData = async () => {
    try {
      const [teamsRes, tasksRes] = await Promise.all([
        api.get('/team/all'), // Fetches name, status, currentLocation
        api.get('/tasks')
      ]);
      setTeams(teamsRes.data);
      setTasks(tasksRes.data);
    } catch (err) {
      console.error('Error fetching admin data:', err);
    }
  };

  useEffect(() => {
    fetchData();

    // ── FEATURE 5: AUTO REFRESH (5 Seconds) ─────────────────────
    const interval = setInterval(fetchData, 5000);

    // ── Real-Time Socket Listeners (for instant updates) ──────────
    socket.on('teamLocationUpdated', (data) => {
      setTeams((prev) =>
        prev.map((t) =>
          String(t._id) === String(data.teamId)
            ? { ...t, currentLocation: { lat: data.lat, lng: data.lng }, status: data.status }
            : t
        )
      );
    });

    socket.on('taskAssigned', (data) => {
      setTasks((prev) => [...prev, data.task]);
      setNotification({ message: `New Task for ${data.teamName}`, type: 'info' });
    });

    return () => {
      clearInterval(interval);
      socket.off('teamLocationUpdated');
      socket.off('taskAssigned');
    };
  }, []);

  return (
    <div className="admin-page-container" style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Navbar />
      <main style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <MapView 
          teams={teams} 
          tasks={tasks} 
        />
      </main>

      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
};

export default AdminMap;

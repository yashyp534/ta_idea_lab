/**
 * src/pages/TeamDashboard.js — Working Team Field Dashboard (FIXED)
 * 
 * FIXES:
 * 1. Real-time location tracking (watchPosition)
 * 2. 5-second interval pings to backend
 * 3. Fallback simulation mode
 * 4. Marker highlight for current user
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import socket from '../services/socket';
import MapView from '../components/MapView';
import Notification from '../components/Notification';
import { formatCoords } from '../utils/mapHelpers';
import './TeamDashboard.css';

const TeamDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // State
  const [team, setTeam] = useState(null);
  const [allTeams, setAllTeams] = useState([]);
  const [myTask, setMyTask] = useState(null);
  const [status, setStatus] = useState('Available');
  const [location, setLocation] = useState({ lat: 20.5937, lng: 78.9629 });
  const [isTracking, setIsTracking] = useState(false);
  const [useSim, setIsSim] = useState(false);
  const [notification, setNotification] = useState(null);

  const watchIdRef = useRef(null);
  const simIntervalRef = useRef(null);

  // ── Fetch Initial Data ───────────────────────────────────────
  const fetchData = async () => {
    try {
      const teamRes = await api.get('/teams/me');
      setTeam(teamRes.data);
      setStatus(teamRes.data.status);
      if (teamRes.data.currentLocation?.lat) {
        setLocation(teamRes.data.currentLocation);
      }

      const allRes = await api.get('/team/all'); // FEATURE 3
      setAllTeams(allRes.data);

      const taskRes = await api.get(`/tasks/mine/${teamRes.data._id}`).catch(() => null);
      if (taskRes) setMyTask(taskRes.data);
    } catch (err) {
      console.error('Data fetch error:', err);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // 10s sync
    return () => clearInterval(interval);
  }, []);

  // ── Real-Time Socket Listeners ───────────────────────────────
  useEffect(() => {
    socket.on('notification', (data) => {
      setNotification({ message: data.message, type: data.type });
      fetchData(); // Refresh to see status changes
    });

    socket.on('teamLocationUpdated', (data) => {
      setAllTeams((prev) =>
        prev.map((t) =>
          String(t._id) === String(data.teamId)
            ? { ...t, currentLocation: { lat: data.lat, lng: data.lng }, status: data.status }
            : t
        )
      );
    });

    return () => {
      socket.off('notification');
      socket.off('teamLocationUpdated');
    };
  }, []);

  // ── FEATURE 4: REAL-TIME TRACKING ────────────────────────────
  const sendUpdate = useCallback(async (loc) => {
    try {
      // POST /api/team/update-location (As requested)
      await api.post('/team/update-location', loc);
      
      // Update local state for map
      setLocation(loc);

      // Emit to socket for others
      socket.emit('locationUpdate', {
        teamId: team?._id,
        lat: loc.lat,
        lng: loc.lng,
        name: user?.name,
        status: status
      });
    } catch (err) {
      console.error('Tracking ping failed:', err);
    }
  }, [team?._id, user?.name, status]);

  const toggleTracking = () => {
    if (isTracking) {
      // Stop
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
      if (simIntervalRef.current) clearInterval(simIntervalRef.current);
      setIsTracking(false);
      setNotification({ message: 'Tracking stopped.', type: 'info' });
    } else {
      // Start
      setIsTracking(true);
      setNotification({ message: 'Live tracking started!', type: 'success' });

      if (navigator.geolocation && !useSim) {
        watchIdRef.current = navigator.geolocation.watchPosition(
          (pos) => {
            const newLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            sendUpdate(newLoc);
          },
          (err) => {
            console.warn('GPS error, switching to simulation.');
            setIsSim(true);
          },
          { enableHighAccuracy: true }
        );
      } else {
        // Fallback Simulation
        simIntervalRef.current = setInterval(() => {
          setLocation(prev => {
            const newLoc = {
              lat: prev.lat + (Math.random() - 0.5) * 0.001,
              lng: prev.lng + (Math.random() - 0.5) * 0.001
            };
            sendUpdate(newLoc);
            return newLoc;
          });
        }, 5000); // FEATURE 4: 5 second interval
      }
    }
  };

  const handleCompleteMission = async () => {
    if (!myTask || !team) return;
    try {
      // POST /api/task/complete
      await api.post('/task/complete', {
        taskId: myTask._id,
        teamId: team._id
      });
      setMyTask(prev => ({ ...prev, status: 'Completed' }));
      setStatus('Mission Completed');
      setNotification({ message: 'Great job! Mission marked as completed.', type: 'success' });
    } catch (err) {
      setNotification({ message: 'Failed to mark mission as completed.', type: 'error' });
    }
  };

  const handleStatusChange = async (s) => {
    try {
      await api.put(`/teams/${team._id}/status`, { status: s });
      setStatus(s);
      setNotification({ message: `Status updated to ${s}`, type: 'success' });
    } catch (err) {
      setNotification({ message: 'Status update failed.', type: 'error' });
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="team-layout">
      {/* Sidebar */}
      <aside className="team-sidebar">
        <div className="sidebar-header" style={{ padding: '20px' }}>
          <h2 style={{ color: '#fff', margin: 0 }}>🚨 Unit Dashboard</h2>
          <p style={{ color: '#94a3b8', fontSize: '12px' }}>Welcome, {user?.name}</p>
        </div>

        <div className="sidebar-content" style={{ padding: '0 20px' }}>
          {/* Tracking Controls */}
          <div className="card" style={{ background: '#1e293b', padding: '15px', borderRadius: '12px', marginBottom: '20px' }}>
            <label style={{ color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase', fontWeight: 'bold' }}>Live Tracking</label>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '10px 0' }}>
              <span style={{ color: '#f1f5f9', fontSize: '14px' }}>
                {isTracking ? '🛰 Transmitting' : '⏸ Paused'}
              </span>
              <div className={`status-dot ${isTracking ? 'available' : 'busy'}`}></div>
            </div>
            <button 
              onClick={toggleTracking} 
              className={`btn btn-full ${isTracking ? 'btn-danger' : 'btn-success'}`}
            >
              {isTracking ? 'Stop Tracking' : 'Start Live Tracking'}
            </button>
            <div style={{ marginTop: '10px', fontSize: '11px', color: '#64748b' }}>
              <input type="checkbox" checked={useSim} onChange={(e) => setIsSim(e.target.checked)} /> Simulate Movement
            </div>
          </div>

          {/* Status Selection */}
          <div className="card" style={{ background: '#1e293b', padding: '15px', borderRadius: '12px', marginBottom: '20px' }}>
            <label style={{ color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase', fontWeight: 'bold' }}>My Status</label>
            <select 
              value={status} 
              onChange={(e) => handleStatusChange(e.target.value)}
              style={{ width: '100%', background: '#0f172a', color: '#fff', border: '1px solid #334155', padding: '10px', borderRadius: '8px', marginTop: '10px' }}
            >
              <option value="Available">Available</option>
              <option value="Busy">Busy</option>
              <option value="On Mission">On Mission</option>
              <option value="Mission Completed">Mission Completed</option>
            </select>
          </div>

          {/* Current Mission Card */}
          {myTask && myTask.status !== 'Completed' && (
            <div className="card" style={{ background: '#1e293b', padding: '15px', borderRadius: '12px', marginBottom: '20px', borderLeft: '4px solid #3b82f6' }}>
              <label style={{ color: '#3b82f6', fontSize: '11px', textTransform: 'uppercase', fontWeight: 'bold' }}>Active Mission</label>
              <div style={{ color: '#f1f5f9', fontSize: '14px', margin: '10px 0' }}>{myTask.description}</div>
              <button onClick={handleCompleteMission} className="btn btn-full btn-primary" style={{ marginTop: '5px' }}>
                ✅ Mark as Completed
              </button>
            </div>
          )}
          <div style={{ color: '#94a3b8', fontSize: '12px', textAlign: 'center' }}>
            📍 {formatCoords(location.lat, location.lng)}
          </div>
        </div>

        <div style={{ marginTop: 'auto', padding: '20px' }}>
          <button onClick={handleLogout} className="btn btn-danger btn-full">Logout</button>
        </div>
      </aside>

      {/* Main Map Area */}
      <main className="team-main" style={{ flex: 1, position: 'relative' }}>
        <MapView 
          teams={allTeams.map(t => String(t._id) === String(team?._id) ? { ...t, currentLocation: location, status } : t)}
          tasks={myTask ? [myTask] : []}
          currentUserTeamId={team?._id}
        />
      </main>

      {notification && <Notification {...notification} onClose={() => setNotification(null)} />}
    </div>
  );
};

export default TeamDashboard;

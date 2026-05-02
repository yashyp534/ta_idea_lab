/**
 * src/pages/AdminDashboard.js — Admin Control Center (UPDATED)
 *
 * NEW features:
 *   1. "Set Team Location" mode — admin clicks map to manually move a team marker
 *   2. Updated legend: Green=Available, Red=Busy, Blue=On Mission
 *   3. lastUpdated shown on team cards ("last seen X ago")
 *   4. Routes updated to /admin-dashboard
 *
 * Existing features preserved:
 *   - Live map, sidebar, task assignment, socket updates
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth }         from '../context/AuthContext';
import { useNavigate }     from 'react-router-dom';
import api                 from '../services/api';
import socket              from '../services/socket';
import MapView             from '../components/MapView';
import TaskAssignModal     from '../components/TaskAssignModal';
import Notification        from '../components/Notification';
import { formatCoords, getTimeSince } from '../utils/mapHelpers';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // ── State ─────────────────────────────────────────────────────
  const [teams,          setTeams]          = useState([]);
  const [tasks,          setTasks]          = useState([]);
  const [showModal,      setShowModal]      = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [clickedLatLng,  setClickedLatLng]  = useState(null);
  const [notification,   setNotification]   = useState(null);
  const [activePanel,    setActivePanel]    = useState('teams');
  const [loading,        setLoading]        = useState(true);

  // ── NEW: Set-Team-Location mode ───────────────────────────────
  // When active, the next map click sets the TEAM's location (not task destination)
  const [setLocMode,       setSetLocMode]       = useState(false);  // Is mode active?
  const [setLocTeamId,     setSetLocTeamId]     = useState('');     // Which team?
  const [setLocTeamName,   setSetLocTeamName]   = useState('');

  // ── Fetch initial data ────────────────────────────────────────
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [teamsRes, tasksRes] = await Promise.all([
          api.get('/teams'),
          api.get('/tasks'),
        ]);
        setTeams(teamsRes.data);
        setTasks(tasksRes.data);
      } catch (err) {
        showNotification('Failed to load dashboard data.', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // ── Socket.io real-time listeners ─────────────────────────────
  useEffect(() => {
    socket.on('teamLocationUpdated', (data) => {
      setTeams((prev) =>
        prev.map((t) =>
          String(t._id) === String(data.teamId)
            ? { ...t, currentLocation: { lat: data.lat, lng: data.lng }, status: data.status, lastUpdated: data.lastUpdated }
            : t
        )
      );
    });

    socket.on('teamStatusUpdated', (data) => {
      setTeams((prev) =>
        prev.map((t) =>
          String(t._id) === String(data.teamId)
            ? { ...t, status: data.status }
            : t
        )
      );
    });

    socket.on('taskAssigned', (data) => {
      setTasks((prev) => [data.task, ...prev]);
      showNotification(`Mission assigned to ${data.teamName}!`, 'success');
    });

    socket.on('taskStatusUpdated', ({ taskId, status }) => {
      setTasks((prev) =>
        prev.map((t) => (String(t._id) === String(taskId) ? { ...t, status } : t))
      );
    });

    return () => {
      socket.off('teamLocationUpdated');
      socket.off('teamStatusUpdated');
      socket.off('taskAssigned');
      socket.off('taskStatusUpdated');
    };
  }, []);

  // ── Helpers ───────────────────────────────────────────────────
  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
  };

  // ── Map click handler ─────────────────────────────────────────
  // Handles two modes:
  //   1. Normal mode → set task destination (existing behaviour)
  //   2. Set-Team-Location mode → move the selected team's marker
  const handleMapClick = useCallback(async (latLng) => {
    if (setLocMode && setLocTeamId) {
      // Mode 2: Set the selected team's location in the DB
      try {
        await api.put(`/teams/${setLocTeamId}/set-location`, { lat: latLng.lat, lng: latLng.lng });
        showNotification(`📍 Location set for ${setLocTeamName}`, 'success');
      } catch (err) {
        showNotification('Failed to set team location.', 'error');
      }
      // Exit set-location mode after one click
      setSetLocMode(false);
      setSetLocTeamId('');
      setSetLocTeamName('');
    } else {
      // Mode 1: Normal task destination click
      setClickedLatLng(latLng);
    }
  }, [setLocMode, setLocTeamId, setLocTeamName]);

  // Enter "set location" mode for a specific team
  const enterSetLocMode = (team) => {
    setSetLocMode(true);
    setSetLocTeamId(team._id);
    setSetLocTeamName(team.name);
    showNotification(`Click on the map to set location for ${team.name}`, 'info');
  };

  // Cancel set-location mode
  const cancelSetLocMode = () => {
    setSetLocMode(false);
    setSetLocTeamId('');
    setSetLocTeamName('');
  };

  const openAssignModal = (teamId = '') => {
    setSelectedTeamId(teamId);
    setShowModal(true);
  };

  const handleAssignTask = async (taskData) => {
    try {
      await api.post('/tasks', taskData);
      setShowModal(false);
      setClickedLatLng(null);
      const teamsRes = await api.get('/teams');
      setTeams(teamsRes.data);
      showNotification('Mission assigned successfully! ✅', 'success');
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Failed to assign task.');
    }
  };

  // ── Status Badge ──────────────────────────────────────────────
  // UPDATED colors: Green=Available, Red=Busy, Blue=On Mission
  const StatusBadge = ({ status }) => {
    const cls =
      status === 'Available'  ? 'available' :
      status === 'Busy'       ? 'busy' :
                                'on-mission';
    return (
      <span className={`badge badge-${cls}`}>
        <span className={`status-dot ${cls}`}></span>
        {status}
      </span>
    );
  };

  const TaskBadge = ({ status }) => {
    const map = {
      'Assigned':    { cls: 'badge-busy',       label: 'Assigned' },
      'In Progress': { cls: 'badge-on-mission',  label: 'In Progress' },
      'Completed':   { cls: 'badge-available',   label: 'Completed' },
    };
    const { cls, label } = map[status] || {};
    return <span className={`badge ${cls}`}>{label}</span>;
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="admin-layout">
      {/* ── Sidebar ─────────────────────────────────────────── */}
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <span className="brand-emoji">🚨</span>
            <div>
              <div className="brand-name">Disaster Response</div>
              <div className="brand-role">Command Center</div>
            </div>
          </div>

          <div className="sidebar-tabs">
            <button
              className={`sidebar-tab ${activePanel === 'teams' ? 'active' : ''}`}
              onClick={() => setActivePanel('teams')}
            >
              🚑 Teams ({teams.length})
            </button>
            <button
              className={`sidebar-tab ${activePanel === 'tasks' ? 'active' : ''}`}
              onClick={() => setActivePanel('tasks')}
            >
              📋 Tasks ({tasks.length})
            </button>
          </div>
        </div>

        <div className="sidebar-body">
          {loading ? (
            <div className="sidebar-loading">
              <span className="spinner"></span>
              <span>Loading data...</span>
            </div>
          ) : activePanel === 'teams' ? (
            <div className="teams-list">
              <div className="panel-section-header">
                <span>All Rescue Teams</span>
                <button
                  className="btn btn-primary"
                  style={{ fontSize: '12px', padding: '6px 12px' }}
                  onClick={() => openAssignModal()}
                >
                  + Assign
                </button>
              </div>

              {teams.length === 0 ? (
                <div className="empty-state">
                  <p>No teams registered yet.</p>
                  <small>Teams appear here after signup.</small>
                </div>
              ) : (
                teams.map((team) => (
                  <div key={team._id} className="team-card">
                    <div className="team-card-top">
                      <div className="team-avatar">
                        {team.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="team-info">
                        <div className="team-name">{team.name}</div>
                        <div className="team-coords">
                          📍 {formatCoords(team.currentLocation?.lat, team.currentLocation?.lng)}
                        </div>
                        {/* NEW: last updated timestamp */}
                        <div className="team-last-seen">
                          🕒 {getTimeSince(team.lastUpdated)}
                        </div>
                      </div>
                    </div>
                    <div className="team-card-bottom">
                      <StatusBadge status={team.status} />
                      <div className="team-actions">
                        <button
                          className="btn btn-secondary"
                          style={{ fontSize: '11px', padding: '4px 8px' }}
                          onClick={() => openAssignModal(team._id)}
                          title="Assign mission"
                        >
                          Assign
                        </button>
                        {/* NEW: Set Location button */}
                        <button
                          className={`btn ${setLocMode && setLocTeamId === team._id ? 'btn-primary' : 'btn-secondary'}`}
                          style={{ fontSize: '11px', padding: '4px 8px' }}
                          onClick={() =>
                            setLocMode && setLocTeamId === team._id
                              ? cancelSetLocMode()
                              : enterSetLocMode(team)
                          }
                          title="Manually set team location on map"
                        >
                          {setLocMode && setLocTeamId === team._id ? '✕ Cancel' : '📍 Set Loc'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="tasks-list">
              <div className="panel-section-header">
                <span>Assigned Missions</span>
              </div>

              {tasks.length === 0 ? (
                <div className="empty-state">
                  <p>No missions yet.</p>
                  <small>Assign a task from the Teams tab.</small>
                </div>
              ) : (
                tasks.map((task) => (
                  <div key={task._id} className="task-card">
                    <div className="task-header-row">
                      <span className="task-team-name">{task.teamName}</span>
                      <TaskBadge status={task.status} />
                    </div>
                    <div className="task-description">{task.description}</div>
                    <div className="task-destination">
                      <span>🎯</span>
                      <span>
                        {task.destination?.label || 'Mission Location'} —{' '}
                        {formatCoords(task.destination?.lat, task.destination?.lng)}
                      </span>
                    </div>
                    <div className="task-time">
                      {new Date(task.createdAt).toLocaleString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <div className="sidebar-footer">
          <div className="footer-user">
            <div className="footer-avatar">A</div>
            <div>
              <div className="footer-name">{user?.name || 'Admin'}</div>
              <div className="footer-email">{user?.email}</div>
            </div>
          </div>
          <button
            className="btn btn-danger"
            style={{ fontSize: '12px', padding: '6px 12px' }}
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </aside>

      {/* ── Main Map Area ──────────────────────────────────────── */}
      <main className="admin-main">
        <div className="admin-topbar">
          <div>
            <h1>Live Operations Map</h1>
            <p>
              {teams.length} team(s) ·{' '}
              {setLocMode
                ? `📍 Click map to set location for "${setLocTeamName}"`
                : 'Click map to set task destination'}
            </p>
          </div>
          <div className="topbar-actions">
            {/* Show set-loc cancel bar when active */}
            {setLocMode && (
              <div className="setloc-banner">
                📍 Setting location for <strong>{setLocTeamName}</strong>
                <button onClick={cancelSetLocMode}>Cancel</button>
              </div>
            )}
            {/* Show task-destination selected coords */}
            {!setLocMode && clickedLatLng && (
              <div className="selected-coords">
                🎯 {clickedLatLng.lat.toFixed(4)}, {clickedLatLng.lng.toFixed(4)}
                <button onClick={() => setClickedLatLng(null)}>✕</button>
              </div>
            )}
            <button className="btn btn-primary" onClick={() => openAssignModal()}>
              + New Mission
            </button>
          </div>
        </div>

        <div className="map-container">
          <MapView
            teams={teams}
            tasks={tasks}
            onMapClick={handleMapClick}
            clickedLatLng={setLocMode ? null : clickedLatLng}
          />
        </div>
      </main>

      {/* ── Modals & Notifications ──────────────────────────────── */}
      {showModal && (
        <TaskAssignModal
          teams={teams}
          selectedTeam={selectedTeamId}
          clickedLatLng={clickedLatLng}
          onAssign={handleAssignTask}
          onClose={() => { setShowModal(false); setClickedLatLng(null); }}
        />
      )}

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

export default AdminDashboard;

/**
 * src/pages/AdminTeams.js — Team Management Sidebar Page
 *
 * Lists all teams with their current status, name, and last seen time.
 * High-visibility layout for dispatchers.
 */

import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Navbar from '../components/Navbar';
import { getTimeSince, TEAM_EMOJIS } from '../utils/mapHelpers';
import './AdminTeams.css';

const AdminTeams = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTeams = async () => {
    try {
      const res = await api.get('/teams');
      setTeams(res.data);
    } catch (err) {
      console.error('Error fetching teams:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
    const interval = setInterval(fetchTeams, 5000); // 5s refresh
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="admin-page-container">
      <Navbar />
      <main className="admin-content">
        <header className="content-header">
          <h1>Rescue Teams Management</h1>
          <p>Real-time status of all field units</p>
        </header>

        <div className="teams-grid">
          {loading ? (
            <div className="loader">Loading units...</div>
          ) : teams.length === 0 ? (
            <div className="empty-state">No rescue teams registered yet.</div>
          ) : (
            teams.map((team) => (
              <div key={team._id} className={`team-status-card status-${team.status.toLowerCase().replace(' ', '-')}`}>
                <div className="card-left">
                  <div className="unit-avatar">
                    {TEAM_EMOJIS[team.teamType] || '🚐'}
                  </div>
                  <div className="unit-info">
                    <h3>{team.name}</h3>
                    <div className="unit-meta">
                      <span className="last-seen">
                        🕒 {getTimeSince(team.lastUpdated)}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="card-right">
                  <div className={`status-badge badge-${team.status.toLowerCase().replace(' ', '-')}`}>
                    {team.status}
                  </div>
                  <div className="unit-coords">
                    📍 {team.currentLocation.lat.toFixed(4)}, {team.currentLocation.lng.toFixed(4)}
                  </div>
                </div>
                
                {team.status === 'On Mission' && (
                  <div className="active-mission-strip">
                    ACTIVE MISSION
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminTeams;

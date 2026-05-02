/**
 * src/pages/AssignTaskPage.js — Dedicated Task Assignment Page
 *
 * Features:
 *   1. Select team from Available units
 *   2. Enter destination via address (Nominatim API)
 *   3. Click on Map to set coordinates
 *   4. Visual confirmation of destination
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import socket from '../services/socket';
import MapView from '../components/MapView';
import Navbar from '../components/Navbar';
import Notification from '../components/Notification';
import './AssignTaskPage.css';

const AssignTaskPage = () => {
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [coords, setCoords] = useState({ lat: null, lng: null });
  const [severity, setSeverity] = useState('Medium'); // NEW: Severity
  const [isSearching, setIsSearching] = useState(false);
  const [notification, setNotification] = useState(null);
  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const res = await api.get('/teams');
        setTeams(res.data.filter(t => t.status === 'Available'));
      } catch (err) {
        console.error('Error fetching teams:', err);
      }
    };
    fetchTeams();
  }, []);

  const handleAddressSearch = async () => {
    if (!address) return;
    setIsSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`);
      const data = await res.json();
      setSearchResults(data.slice(0, 5));
    } catch (err) {
      setNotification({ message: 'Address search failed.', type: 'error' });
    } finally {
      setIsSearching(false);
    }
  };

  const selectResult = (result) => {
    setCoords({ lat: parseFloat(result.lat), lng: parseFloat(result.lon) });
    setAddress(result.display_name);
    setSearchResults([]);
  };

  const handleMapClick = (latlng) => {
    setCoords(latlng);
    setAddress(`Custom Location (${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)})`);
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!selectedTeamId || !coords.lat || !description) {
      setNotification({ message: 'Please fill all fields and pick a location.', type: 'warning' });
      return;
    }

    try {
      const taskData = {
        teamId: selectedTeamId,
        description,
        destination: {
          lat: coords.lat,
          lng: coords.lng,
          label: address
        },
        severity // NEW: Send severity
      };

      const res = await api.post('/tasks', taskData);
      
      // Notify via Socket
      const team = teams.find(t => t._id === selectedTeamId);
      socket.emit('taskAssigned', {
        teamId: selectedTeamId,
        teamName: team?.name,
        task: res.data
      });

      setNotification({ message: 'Task assigned successfully!', type: 'success' });
      setTimeout(() => navigate('/admin-map'), 1500);
    } catch (err) {
      setNotification({ message: 'Failed to assign task.', type: 'error' });
    }
  };

  return (
    <div className="admin-page-container">
      <Navbar />
      <main className="assign-task-main">
        <div className="assign-form-panel">
          <h2>Assign New Mission</h2>
          <p>Deploy a rescue team to a specific location</p>

          <form onSubmit={handleAssign}>
            <div className="form-group">
              <label>Select Team</label>
              <select 
                value={selectedTeamId} 
                onChange={(e) => setSelectedTeamId(e.target.value)}
                className="form-input"
              >
                <option value="">-- Choose an Available Team --</option>
                {teams.map(t => (
                  <option key={t._id} value={t._id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Mission Description</label>
              <textarea 
                placeholder="Describe the rescue operation..." 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="form-input"
                rows="3"
              />
            </div>

            {/* SEVERITY SELECTION */}
            <div className="form-group">
              <label>Incident Severity</label>
              <select 
                className="form-input" 
                value={severity} 
                onChange={(e) => setSeverity(e.target.value)}
              >
                <option value="Low">🟢 Low</option>
                <option value="Medium">🟡 Medium</option>
                <option value="High">🟠 High</option>
                <option value="Critical">🔴 Critical</option>
              </select>
            </div>

            <div className="form-group search-group">
              <label>Destination Address</label>
              <div className="search-row">
                <input 
                  type="text" 
                  placeholder="Enter address..." 
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="form-input"
                />
                <button type="button" onClick={handleAddressSearch} className="btn btn-primary">
                  {isSearching ? '...' : '🔍'}
                </button>
              </div>
              
              {searchResults.length > 0 && (
                <ul className="search-results">
                  {searchResults.map((r, i) => (
                    <li key={i} onClick={() => selectResult(r)}>{r.display_name}</li>
                  ))}
                </ul>
              )}
            </div>

            <div className="coords-preview">
              <span>LAT: {coords.lat ? coords.lat.toFixed(6) : '—'}</span>
              <span>LNG: {coords.lng ? coords.lng.toFixed(6) : '—'}</span>
            </div>

            <button type="submit" className="btn btn-success btn-full">
              🚀 Assign Mission
            </button>
          </form>
        </div>

        <div className="assign-map-panel">
          <MapView 
            teams={[]} // Don't show markers here to keep focus on picking
            onMapClick={handleMapClick} 
            clickedLatLng={coords.lat ? coords : null}
          />
        </div>
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

export default AssignTaskPage;

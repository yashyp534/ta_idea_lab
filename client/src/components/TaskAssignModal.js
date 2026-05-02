/**
 * src/components/TaskAssignModal.js — Task Assignment Modal (UPDATED)
 *
 * NEW features added:
 *   1. "Search by Address" — uses OpenStreetMap Nominatim (FREE, no API key)
 *      to convert an address like "Pune" → { lat, lng }
 *   2. All existing features preserved (map click, manual input, team selector)
 *
 * Props:
 *   teams          (array)  — All teams
 *   selectedTeam   (string) — Pre-selected teamId
 *   clickedLatLng  (object) — { lat, lng } from last map click
 *   onAssign       (func)   — Submit handler
 *   onClose        (func)   — Close handler
 */

import React, { useState, useEffect } from 'react';
import './TaskAssignModal.css';

const TaskAssignModal = ({ teams, selectedTeam, clickedLatLng, onAssign, onClose }) => {
  const [teamId,        setTeamId]        = useState(selectedTeam || '');
  const [description,   setDescription]   = useState('');
  const [destLat,       setDestLat]       = useState('');
  const [destLng,       setDestLng]       = useState('');
  const [destLabel,     setDestLabel]     = useState('');
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState('');

  // ── Address Search state ──────────────────────────────────────
  const [addressQuery,    setAddressQuery]    = useState('');   // What user types
  const [addressResults,  setAddressResults]  = useState([]);   // Nominatim suggestions
  const [searchLoading,   setSearchLoading]   = useState(false);
  const [searchError,     setSearchError]     = useState('');

  // ── Sync props to state ───────────────────────────────────────
  useEffect(() => {
    if (clickedLatLng) {
      setDestLat(clickedLatLng.lat.toFixed(6));
      setDestLng(clickedLatLng.lng.toFixed(6));
    }
  }, [clickedLatLng]);

  useEffect(() => {
    if (selectedTeam) setTeamId(selectedTeam);
  }, [selectedTeam]);

  // ── Address Search via Nominatim ──────────────────────────────
  // OpenStreetMap Nominatim is 100% FREE — no API key needed.
  // Docs: https://nominatim.org/release-docs/latest/api/Search/
  const handleAddressSearch = async () => {
    if (!addressQuery.trim()) return;

    setSearchLoading(true);
    setSearchError('');
    setAddressResults([]);

    try {
      // Build URL: encode the query to handle spaces and special chars
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(addressQuery)}&format=json&limit=5&countrycodes=in`;

      // Nominatim requires a User-Agent header in production but works in browser
      const res = await fetch(url, {
        headers: {
          // Required by Nominatim usage policy
          'Accept-Language': 'en',
        },
      });

      if (!res.ok) throw new Error('Search request failed');

      const data = await res.json();

      if (data.length === 0) {
        setSearchError('No results found. Try a different address.');
      } else {
        setAddressResults(data);
      }
    } catch (err) {
      setSearchError('Failed to search address. Check your internet connection.');
    } finally {
      setSearchLoading(false);
    }
  };

  // When the user picks a result from the dropdown
  const handleSelectResult = (result) => {
    setDestLat(parseFloat(result.lat).toFixed(6));
    setDestLng(parseFloat(result.lon).toFixed(6));
    setDestLabel(result.display_name.split(',')[0]); // Use first part as label
    setAddressResults([]); // Hide dropdown
    setAddressQuery(result.display_name.split(',')[0]);
  };

  // ── Form Submit ───────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!teamId) return setError('Please select a team.');
    if (!destLat || !destLng) return setError('Please enter or search for a destination.');

    setLoading(true);
    try {
      await onAssign({
        teamId,
        description: description || 'Emergency Response Mission',
        destination: {
          lat:   parseFloat(destLat),
          lng:   parseFloat(destLng),
          label: destLabel || addressQuery || 'Mission Location',
        },
      });
    } catch (err) {
      setError(err.message || 'Failed to assign task.');
      setLoading(false);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal-box">
        {/* Header */}
        <div className="modal-header">
          <div>
            <h3>Assign Mission</h3>
            <p>Select team, set destination by address or map click</p>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">×</button>
        </div>

        {error && <div className="alert alert-error">⚠ {error}</div>}

        <form onSubmit={handleSubmit}>
          {/* Team selector */}
          <div className="form-group">
            <label className="form-label">Rescue Team</label>
            <select
              className="form-select"
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
              required
            >
              <option value="">— Select a team —</option>
              {teams.map((team) => (
                <option key={team._id} value={team._id}>
                  {team.name} — {team.status}
                </option>
              ))}
            </select>
          </div>

          {/* Mission description */}
          <div className="form-group">
            <label className="form-label">Mission Description</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Flood rescue at Riverside Colony"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* ── Address Search Section (NEW) ───────────────────── */}
          <div className="address-search-section">
            <label className="form-label">🔍 Search Destination by Address</label>
            <div className="address-search-row">
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Pune, Mumbai, Sector 4 Delhi..."
                value={addressQuery}
                onChange={(e) => setAddressQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddressSearch())}
              />
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleAddressSearch}
                disabled={searchLoading}
                style={{ flexShrink: 0 }}
              >
                {searchLoading ? <span className="spinner"></span> : 'Search'}
              </button>
            </div>

            {/* Search error */}
            {searchError && (
              <p style={{ color: 'var(--accent-red)', fontSize: '12px', marginTop: '6px' }}>
                ⚠ {searchError}
              </p>
            )}

            {/* Dropdown results */}
            {addressResults.length > 0 && (
              <div className="address-results">
                {addressResults.map((result) => (
                  <div
                    key={result.place_id}
                    className="address-result-item"
                    onClick={() => handleSelectResult(result)}
                  >
                    <strong>{result.display_name.split(',')[0]}</strong>
                    <small>{result.display_name.split(',').slice(1, 3).join(',')}</small>
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* ── End Address Search ─────────────────────────────── */}

          {/* Map click hint */}
          <div className="modal-coords-hint">
            <span>📍</span>
            <span>
              {clickedLatLng
                ? `Map click: ${clickedLatLng.lat.toFixed(4)}, ${clickedLatLng.lng.toFixed(4)}`
                : 'Or click anywhere on the map to auto-fill coordinates below'}
            </span>
          </div>

          {/* Coordinate inputs */}
          <div className="modal-coord-row">
            <div className="form-group">
              <label className="form-label">Latitude</label>
              <input
                type="number"
                step="any"
                className="form-input"
                placeholder="e.g. 19.0760"
                value={destLat}
                onChange={(e) => setDestLat(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Longitude</label>
              <input
                type="number"
                step="any"
                className="form-input"
                placeholder="e.g. 72.8777"
                value={destLng}
                onChange={(e) => setDestLng(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Location label */}
          <div className="form-group">
            <label className="form-label">
              Location Label <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span>
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Sector 4 Flood Zone"
              value={destLabel}
              onChange={(e) => setDestLabel(e.target.value)}
            />
          </div>

          {/* Action buttons */}
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <><span className="spinner"></span> Assigning...</> : '🎯 Assign Mission'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskAssignModal;

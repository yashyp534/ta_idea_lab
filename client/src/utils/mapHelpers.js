/**
 * src/utils/mapHelpers.js — Leaflet Map Utility Functions
 *
 * UPDATED COLOR SCHEME (per new requirements):
 *   Green  → Available
 *   Red    → Busy
 *   Blue   → On Mission
 */

import L from 'leaflet';

// ── Status → Color Mapping ─────────────────────────────────────
export const STATUS_COLORS = {
  'Available':         '#10b981',  // Green
  'Busy':              '#ef4444',  // Red
  'On Mission':        '#3b82f6',  // Blue
  'Mission Completed': '#6b7280',  // Gray (NEW)
};

// ── Team Type → Emoji Mapping ──────────────────────────────────
export const TEAM_EMOJIS = {
  'Ambulance':  '🚑',
  'Fire Truck': '🚒',
  'Police':     '🚓',
  'Rescue Van':  '🚐',
};

// ── Severity → Color Mapping ───────────────────────────────────
export const SEVERITY_COLORS = {
  'Low':      '#10b981', // Green
  'Medium':   '#f59e0b', // Yellow
  'High':     '#f97316', // Orange
  'Critical': '#ef4444', // Red
};

// ── createCustomMarker ─────────────────────────────────────────
// Creates a colored circle marker based on status with EMOJI
export const createCustomMarker = (status, teamType) => {
  const color = STATUS_COLORS[status] || '#8b5cf6';
  // Standardize teamType or fallback to Rescue Van
  const type = (teamType && TEAM_EMOJIS[teamType]) ? teamType : 'Rescue Van';
  const emoji = TEAM_EMOJIS[type];

  return L.divIcon({
    className: 'custom-team-marker',
    html: `
      <div style="position: relative; width: 42px; height: 42px; display: flex; align-items: center; justify-content: center;">
        <div style="
          position: absolute; width: 38px; height: 38px;
          background: ${color};
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 3px 10px rgba(0,0,0,0.4);
          z-index: 1;
        "></div>
        <div style="position: relative; font-size: 22px; z-index: 2; margin-top: -2px;">${emoji}</div>
      </div>
    `,
    iconSize:   [42, 42],
    iconAnchor: [21, 21],
  });
};

// ── createPulsingMarker ────────────────────────────────────────
// Pulsing marker for "On Mission" teams with EMOJI
export const createPulsingMarker = (teamType) => {
  const color = STATUS_COLORS['On Mission']; // Blue
  const type = (teamType && TEAM_EMOJIS[teamType]) ? teamType : 'Rescue Van';
  const emoji = TEAM_EMOJIS[type];

  return L.divIcon({
    className: 'pulsing-team-marker',
    html: `
      <div style="position: relative; width: 50px; height: 50px; display: flex; align-items: center; justify-content: center;">
        <div style="
          position: absolute; width: 100%; height: 100%;
          background: ${color}55;
          border-radius: 50%;
          animation: markerPulse 1.8s ease-out infinite;
          z-index: 0;
        "></div>
        <div style="
          position: absolute; width: 38px; height: 38px;
          background: ${color};
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 3px 12px rgba(0,0,0,0.5);
          z-index: 1;
        "></div>
        <div style="position: relative; font-size: 22px; z-index: 2; margin-top: -2px;">${emoji}</div>
      </div>
      <style>
        @keyframes markerPulse {
          0%   { transform: scale(0.8); opacity: 0.9; }
          100% { transform: scale(2.2); opacity: 0; }
        }
      </style>
    `,
    iconSize:   [50, 50],
    iconAnchor: [25, 25],
  });
};

// ── getMarkerForTeam ───────────────────────────────────────────
// Returns the correct marker icon for a team based on their status and type
export const getMarkerForTeam = (status, teamType = 'Rescue Van') => {
  if (status === 'On Mission') return createPulsingMarker(teamType);
  return createCustomMarker(status, teamType);
};

// ── createDestinationMarker ────────────────────────────────────
// Purple diamond to mark task destinations
export const createDestinationMarker = () => {
  return L.divIcon({
    className: '',
    html: `
      <div style="
        width: 20px; height: 20px;
        background: #8b5cf6;
        border: 3px solid rgba(255,255,255,0.9);
        border-radius: 4px;
        transform: rotate(45deg);
        box-shadow: 0 2px 8px rgba(0,0,0,0.5);
      "></div>
    `,
    iconSize:   [20, 20],
    iconAnchor: [10, 10],
  });
};

// ── createSelectedLocationMarker ───────────────────────────────
// Yellow marker shown when admin clicks map to pick a position
export const createSelectedLocationMarker = () => {
  return L.divIcon({
    className: '',
    html: `
      <div style="
        width: 22px; height: 22px;
        background: #f59e0b;
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 0 0 4px rgba(245,158,11,0.4);
      "></div>`,
    iconSize:   [22, 22],
    iconAnchor: [11, 11],
  });
};

// ── formatCoords ───────────────────────────────────────────────
export const formatCoords = (lat, lng) => {
  if (lat === undefined || lat === null || lng === undefined || lng === null) return 'Unknown';
  return `${Number(lat).toFixed(4)}, ${Number(lng).toFixed(4)}`;
};

// ── getTimeSince ───────────────────────────────────────────────
// Returns a human-readable "X min ago" from a date
export const getTimeSince = (dateStr) => {
  if (!dateStr) return 'Never';
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60)   return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
};

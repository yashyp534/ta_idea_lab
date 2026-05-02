/**
 * src/components/MapView.js — Stabilized Leaflet Map
 * 
 * FIXED: 
 * - TypeError: Cannot read properties of undefined (reading 'appendChild')
 * - Ensures map panes are ready before adding markers.
 * - Handles Leaflet default icons correctly for React/Webpack.
 */

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { getMarkerForTeam, createDestinationMarker, STATUS_COLORS } from '../utils/mapHelpers';
import './MapView.css';

// Fix for default Leaflet icons
delete L.Icon.Default.prototype._getIconUrl;

const MapView = ({ teams = [], tasks = [], onMapClick, clickedLatLng, currentUserTeamId }) => {
  const mapDivRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);
  
  // Refs to track layers so we can update them without re-creating
  const markersRef = useRef({});
  const polylinesRef = useRef({});
  const destMarkersRef = useRef({});

  // ── 1. Initialize Map ───────────────────────────────────────
  useEffect(() => {
    // Only run if the div exists and map isn't initialized
    if (!mapDivRef.current || mapInstanceRef.current) return;

    // Configure icons inside the effect to ensure clean state
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
      iconUrl:       require('leaflet/dist/images/marker-icon.png'),
      shadowUrl:     require('leaflet/dist/images/marker-shadow.png'),
    });

    const map = L.map(mapDivRef.current, {
      center: [20.5937, 78.9629],
      zoom: 5,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(map);

    map.on('click', (e) => {
      if (onMapClick) onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng });
    });

    mapInstanceRef.current = map;
    setMapReady(true);

    // Cleanup on unmount
    return () => {
      setMapReady(false);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps


  // ── 2. Update Team Markers ──────────────────────────────────
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    // Remove markers for teams that disappeared
    Object.keys(markersRef.current).forEach((id) => {
      if (!teams.find(t => String(t._id) === id)) {
        map.removeLayer(markersRef.current[id]);
        delete markersRef.current[id];
      }
    });

    // Add or Update markers
    teams.forEach((team) => {
      const { lat, lng } = team.currentLocation;
      if (lat === undefined || lng === undefined) return;

      const isMe = String(team._id) === String(currentUserTeamId);
      // Fallback: ensure teamType is passed or defaults to Rescue Van
      const tType = team.teamType || 'Rescue Van';
      const icon = getMarkerForTeam(team.status, tType); 

      const myTask = tasks.find(t => String(t.teamId) === String(team._id) && t.status !== 'Completed');
      
      const popupContent = `
        <div style="font-family: sans-serif; min-width: 140px; padding: 5px;">
          <strong style="color:#1e293b; font-size: 14px;">${team.name} ${isMe ? '(YOU)' : ''}</strong><br/>
          <div style="margin: 8px 0;">
            <span style="color: ${STATUS_COLORS[team.status]}; font-weight: bold;">● ${team.status}</span>
          </div>
          ${myTask ? `
            <div style="font-size: 11px; color: #64748b; border-top: 1px solid #eee; pt: 5px;">
              <strong>Active Mission:</strong><br/>
              ${myTask.description}<br/>
              <div style="margin-top: 4px;">
                <span style="color: #3b82f6;">Status: ${myTask.status}</span> | 
                <span style="color: #f59e0b;">Severity: ${myTask.severity}</span>
              </div>
            </div>
          ` : ''}
        </div>
      `;

      if (markersRef.current[team._id]) {
        const marker = markersRef.current[team._id];
        const oldPos = marker.getLatLng();
        
        // Only animate if the distance moved is significant (to avoid micro-jitter)
        // and if it's not the first load
        if (Math.abs(oldPos.lat - lat) > 0.00001 || Math.abs(oldPos.lng - lng) > 0.00001) {
          // Smooth interpolation over 2 seconds for a "driving" feel
          const startLat = oldPos.lat;
          const startLng = oldPos.lng;
          const startTime = performance.now();
          const duration = 2000;

          const animate = (time) => {
            const elapsed = time - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Ease out quad for smoother stops
            const easedProgress = progress * (2 - progress);

            const currentLat = startLat + (lat - startLat) * easedProgress;
            const currentLng = startLng + (lng - startLng) * easedProgress;
            
            marker.setLatLng([currentLat, currentLng]);

            if (progress < 1) {
              requestAnimationFrame(animate);
            }
          };
          requestAnimationFrame(animate);
        }
        
        marker.setPopupContent(popupContent);
        // Update icon if status/type changed
        marker.setIcon(icon);
      } else {
        const marker = L.marker([lat, lng], { icon }).addTo(map).bindPopup(popupContent);
        markersRef.current[team._id] = marker;
      }
    });
  }, [teams, mapReady, currentUserTeamId]);


  // ── 3. Update Task Routes ───────────────────────────────────
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    // Clear previous task visuals
    Object.values(polylinesRef.current).forEach(pl => map.removeLayer(pl));
    Object.values(destMarkersRef.current).forEach(dm => map.removeLayer(dm));
    polylinesRef.current = {};
    destMarkersRef.current = {};

    tasks.filter(t => t.status !== 'Completed').forEach(task => {
      const team = teams.find(t => String(t._id) === String(task.teamId));
      if (!team) return;

      const teamLoc = [team.currentLocation.lat, team.currentLocation.lng];
      const destLoc = [task.destination.lat, task.destination.lng];

      const line = L.polyline([teamLoc, destLoc], { color: '#3b82f6', weight: 3, dashArray: '10, 10' }).addTo(map);
      polylinesRef.current[task._id] = line;

      const destMarker = L.marker(destLoc, { icon: createDestinationMarker() })
        .addTo(map)
        .bindPopup(`<b>Mission Destination</b><br/>${task.description}`);
      destMarkersRef.current[task._id] = destMarker;
    });
  }, [tasks, teams, mapReady]);


  // ── 4. Update Clicked Destination Marker ───────────────────
  const clickMarkerRef = useRef(null);
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (clickMarkerRef.current) {
      map.removeLayer(clickMarkerRef.current);
    }

    if (clickedLatLng) {
      clickMarkerRef.current = L.marker([clickedLatLng.lat, clickedLatLng.lng])
        .addTo(map)
        .bindPopup("Selected Point")
        .openPopup();
    }
  }, [clickedLatLng, mapReady]);


  return (
    <div className="map-view-container" style={{ height: '100%', width: '100%', position: 'relative' }}>
      <div ref={mapDivRef} style={{ height: '100%', width: '100%' }} />
      
      {/* Legend */}
      <div className="map-legend" style={{
        position: 'absolute', 
        bottom: '20px', 
        right: '20px', 
        zIndex: 1000,
        background: 'white', 
        padding: '12px', 
        borderRadius: '10px', 
        boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
        maxHeight: '300px', 
        overflowY: 'auto',
        minWidth: '150px',
        border: '1px solid #e2e8f0'
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '13px', color: '#1e293b', borderBottom: '1px solid #eee', paddingBottom: '4px' }}>Map Legend</div>
        
        {/* Statuses */}
        <div style={{ marginBottom: '10px' }}>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px', textTransform: 'uppercase' }}>Statuses</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#333', marginBottom: '4px' }}>
            <span style={{ width: '10px', height: '10px', background: '#10b981', borderRadius: '50%' }}></span> Available
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#333', marginBottom: '4px' }}>
            <span style={{ width: '10px', height: '10px', background: '#ef4444', borderRadius: '50%' }}></span> Busy
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#333', marginBottom: '4px' }}>
            <span style={{ width: '10px', height: '10px', background: '#3b82f6', borderRadius: '50%' }}></span> On Mission
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#333' }}>
            <span style={{ width: '10px', height: '10px', background: '#6b7280', borderRadius: '50%' }}></span> Mission Completed
          </div>
        </div>

        {/* Team Types */}
        <div style={{ borderTop: '1px solid #eee', pt: '8px' }}>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px', textTransform: 'uppercase' }}>Unit Types</div>
          <div style={{ fontSize: '12px', color: '#333' }}>
            🚑 Ambulance <br/>
            🚒 Fire Truck <br/>
            🚓 Police <br/>
            🚐 Rescue Van
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapView;

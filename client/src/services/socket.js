/**
 * src/services/socket.js — Socket.io Client Setup
 * 
 * Creates a single Socket.io connection to our backend.
 * We export this one instance and reuse it everywhere (singleton pattern).
 * This avoids creating multiple connections.
 * 
 * Real-time events we use:
 *  - teamLocationUpdated → Update marker on Admin map
 *  - teamStatusUpdated   → Update status badge on sidebar
 *  - taskAssigned        → Show notification to team
 *  - taskStatusUpdated   → Update task list for admin
 */

import { io } from 'socket.io-client';

// Connect to the backend server
// autoConnect: false means we control when to connect
const socket = io('http://localhost:5000', {
  autoConnect: true,   // Connect immediately when the module loads
  transports: ['websocket', 'polling'], // Try websocket first, fall back to polling
});

// Log connection events (helpful during development)
socket.on('connect', () => {
  console.log('🔌 Socket connected:', socket.id);
});

socket.on('disconnect', () => {
  console.log('🔌 Socket disconnected');
});

socket.on('connect_error', (err) => {
  console.warn('Socket connection error:', err.message);
});

export default socket;

/**
 * index.js — Main Entry Point for the Backend Server
 * 
 * This file:
 * 1. Loads environment variables from .env
 * 2. Connects to MongoDB Atlas
 * 3. Sets up Express + Socket.io
 * 4. Registers all API routes
 * 5. Starts listening on the specified port
 */

const express = require('express');
const http = require('http');                // Node's built-in HTTP module
const { Server } = require('socket.io');    // Socket.io for real-time communication
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

// ── Import route files ──────────────────────────────────────────────────────
const authRoutes  = require('./routes/authRoutes');
const teamRoutes  = require('./routes/teamRoutes');
const taskRoutes  = require('./routes/taskRoutes');
const adminRoutes = require('./routes/adminRoutes'); // NEW

// ── Create Express app and HTTP server ─────────────────────────────────────
const app    = express();
const server = http.createServer(app);  // Wrap Express in an HTTP server for Socket.io

// ── Socket.io Setup ─────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

// Attach io to every request so controllers can use it (e.g., emit events)
app.use((req, _res, next) => {
  req.io = io;
  next();
});

// ── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json()); // Parse incoming JSON bodies

// ── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/auth',  authRoutes);   // /api/auth/signup, /api/auth/login
app.use('/api/teams', teamRoutes);   // plural: /api/teams/:id/location, etc.
app.use('/api/team',  teamRoutes);   // singular: /api/team/update-location
app.use('/api/tasks', taskRoutes);   // plural: /api/tasks
app.use('/api/task',  taskRoutes);   // singular: /api/task/complete
app.use('/api/admin', adminRoutes);  // NEW: /api/admin/clear-data

// Health check endpoint — useful for quickly testing if the server is alive
app.get('/api/health', (_req, res) => {
  res.json({ status: 'Server is running ✅' });
});

// ── Socket.io Events ─────────────────────────────────────────────────────────
// When a client connects via WebSocket:
io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  // A team sends their updated location → broadcast it to all other clients
  // This is the core of real-time tracking!
  socket.on('locationUpdate', (data) => {
    // data = { teamId, lat, lng, name, status }
    socket.broadcast.emit('teamLocationUpdated', data);
  });

  // A team updates their status → broadcast to all clients
  socket.on('statusUpdate', (data) => {
    // data = { teamId, status }
    socket.broadcast.emit('teamStatusUpdated', data);
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

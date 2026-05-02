/**
 * controllers/teamController.js — Rescue Team CRUD Operations
 *
 * getAllTeams:       Admin gets all teams with location + status
 * getMyTeam:        Team member gets their own profile
 * updateLocation:   Team sends updated GPS coordinates (frequent)
 * updateStatus:     Team changes their status
 * setTeamLocation:  NEW — Admin manually sets a team's location (map click or coords)
 */

const Team = require('../models/Team');
const Task = require('../models/Task'); // NEW: For auto-completion check

// ── Helper: Haversine distance in meters ───────────────────────
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371000; // Earth radius in meters
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// ── getAllTeams ────────────────────────────────────────────────
// GET /api/teams
// Returns all teams — used by Admin AND Team dashboards
const getAllTeams = async (req, res) => {
  try {
    const teams = await Team.find().populate('userId', 'name email');
    res.json(teams);
  } catch (err) {
    console.error('getAllTeams error:', err.message);
    res.status(500).json({ message: 'Failed to fetch teams.' });
  }
};

// ── getMyTeam ──────────────────────────────────────────────────
// GET /api/teams/me
// Returns the currently logged-in team member's profile
const getMyTeam = async (req, res) => {
  try {
    const team = await Team.findOne({ userId: req.user._id });
    if (!team) {
      return res.status(404).json({ message: 'Team profile not found.' });
    }
    res.json(team);
  } catch (err) {
    console.error('getMyTeam error:', err.message);
    res.status(500).json({ message: 'Failed to fetch your team profile.' });
  }
};

// ── updateLocation ─────────────────────────────────────────────
// PUT /api/teams/:id/location
// Called every 5–10 seconds by the rescue team app.
// UPDATED: now also saves `lastUpdated` timestamp.
const updateLocation = async (req, res) => {
  try {
    const { lat, lng } = req.body;

    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ message: 'lat and lng are required.' });
    }

    // Update location AND timestamp together
    const team = await Team.findByIdAndUpdate(
      req.params.id,
      {
        currentLocation: { lat, lng },
        lastUpdated: new Date(), // Record exact time of this ping
      },
      { new: true }
    );

    if (!team) {
      return res.status(404).json({ message: 'Team not found.' });
    }

    // Broadcast to all connected clients (admin map updates instantly)
    req.io.emit('teamLocationUpdated', {
      teamId:      team._id,
      name:        team.name,
      status:      team.status,
      lat,
      lng,
      lastUpdated: team.lastUpdated,
    });

    res.json({ message: 'Location updated.', team });
  } catch (err) {
    console.error('updateLocation error:', err.message);
    res.status(500).json({ message: 'Failed to update location.' });
  }
};

// ── updateStatus ───────────────────────────────────────────────
// PUT /api/teams/:id/status
const updateStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const validStatuses = ['Available', 'Busy', 'On Mission'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value.' });
    }

    const team = await Team.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!team) {
      return res.status(404).json({ message: 'Team not found.' });
    }

    req.io.emit('teamStatusUpdated', {
      teamId: team._id,
      status: team.status,
    });

    res.json({ message: 'Status updated.', team });
  } catch (err) {
    console.error('updateStatus error:', err.message);
    res.status(500).json({ message: 'Failed to update status.' });
  }
};

// ── setTeamLocation ────────────────────────────────────────────
// PUT /api/teams/:id/set-location  (Admin only)
// NEW: Allows Admin to manually override a team's location.
// Use case: Team's GPS is offline or wrong; admin corrects it on the map.
const setTeamLocation = async (req, res) => {
  try {
    const { lat, lng } = req.body;

    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ message: 'lat and lng are required.' });
    }

    const team = await Team.findByIdAndUpdate(
      req.params.id,
      {
        currentLocation: { lat, lng },
        lastUpdated: new Date(),
      },
      { new: true }
    );

    if (!team) {
      return res.status(404).json({ message: 'Team not found.' });
    }

    // Broadcast update so all clients see the moved marker immediately
    req.io.emit('teamLocationUpdated', {
      teamId:      team._id,
      name:        team.name,
      status:      team.status,
      lat,
      lng,
      lastUpdated: team.lastUpdated,
    });

    res.json({ message: `Location set for ${team.name}.`, team });
  } catch (err) {
    console.error('setTeamLocation error:', err.message);
    res.status(500).json({ message: 'Failed to set team location.' });
  }
};

// ── updateLocationByAuth ───────────────────────────────────────
// POST /api/teams/update-location
// Automatically finds the team profile for the logged-in user and updates location.
const updateLocationByAuth = async (req, res) => {
  try {
    const { lat, lng } = req.body;
    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ message: 'lat and lng are required.' });
    }

    const team = await Team.findOneAndUpdate(
      { userId: req.user._id },
      {
        currentLocation: { lat, lng },
        lastUpdated: new Date(),
      },
      { new: true }
    );

    if (!team) {
      return res.status(404).json({ message: 'Team profile not found for this user.' });
    }

    // Broadcast update
    req.io.emit('teamLocationUpdated', {
      teamId:      team._id,
      name:        team.name,
      status:      team.status,
      lat,
      lng,
      lastUpdated: team.lastUpdated,
    });

    // ── FEATURE 1: AUTO MISSION COMPLETION CHECK ────────────────
    // Check if team has an active task (Assigned or In Progress)
    const activeTask = await Task.findOne({ 
      teamId: team._id, 
      status: { $in: ['Assigned', 'In Progress'] } 
    });

    if (activeTask) {
      const dist = calculateDistance(
        lat, lng, 
        activeTask.destination.lat, 
        activeTask.destination.lng
      );

      // If within 50 meters, auto-complete!
      if (dist < 50) {
        activeTask.status = 'Completed';
        await activeTask.save();

        team.status = 'Mission Completed';
        await team.save();

        // Notify via sockets
        req.io.emit('taskStatusUpdated', { taskId: activeTask._id, status: 'Completed' });
        req.io.emit('teamStatusUpdated', { teamId: team._id, status: 'Mission Completed' });
        
        // Broadcast completion message
        req.io.emit('notification', {
          message: `✅ ${team.name} has completed the task: ${activeTask.description}`,
          type: 'success'
        });

        return res.json({ 
          message: 'Location updated and MISSION AUTO-COMPLETED!', 
          autoCompleted: true,
          lastUpdated: team.lastUpdated 
        });
      }
    }

    res.json({ message: 'Location synchronized.', lastUpdated: team.lastUpdated });
  } catch (err) {
    console.error('updateLocationByAuth error:', err.message);
    res.status(500).json({ message: 'Failed to sync location.' });
  }
};

module.exports = {
  getAllTeams,
  getMyTeam,
  updateLocation,
  updateLocationByAuth, // Export new method
  updateStatus,
  setTeamLocation,
};

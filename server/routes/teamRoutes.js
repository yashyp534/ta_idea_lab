/**
 * routes/teamRoutes.js — Rescue Team API Routes
 *
 * GET  /api/teams              → Get all teams (any logged-in user)
 * GET  /api/teams/me           → Get my team profile (team member)
 * PUT  /api/teams/:id/location → Update my location (team member, frequent)
 * PUT  /api/teams/:id/status   → Update my status (team member)
 * PUT  /api/teams/:id/set-location → Admin manually sets a team's location (NEW)
 */

const express = require('express');
const router  = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const {
  getAllTeams,
  getMyTeam,
  updateLocation,
  updateLocationByAuth, // NEW: handles POST /api/team/update-location
  updateStatus,
  setTeamLocation,
} = require('../controllers/teamController');

// Any authenticated user can see all teams (admin for map, team for peer visibility)
router.get('/', protect, getAllTeams);

// Team member: View own profile
router.get('/me', protect, getMyTeam);

// NEW: Public-style route to fetch all teams for map display
router.get('/all', getAllTeams);

// Team member: Send location update (called every 5–10 seconds)
router.put('/:id/location', protect, updateLocation);

// NEW: Role-based location update (Uber-style tracking)
router.post('/update-location', protect, updateLocationByAuth);

// Team member: Change operational status
router.put('/:id/status', protect, updateStatus);

// Admin only: Manually override a team's location on the map
router.put('/:id/set-location', protect, adminOnly, setTeamLocation);

module.exports = router;

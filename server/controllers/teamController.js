/**
 * controllers/teamController.js — Rescue Team CRUD Operations
 *
 * getAllTeams:       Admin gets all teams with location + status
 * getMyTeam:        Team member gets their own profile
 * updateLocation:   Team sends updated GPS coordinates (frequent)
 * updateStatus:     Team changes their status
 * setTeamLocation:  NEW — Admin manually sets a team's location (map click or coords)
 */

const { db } = require('../firebase');
const { collection, getDocs, doc, getDoc, updateDoc, query, where } = require('firebase/firestore');

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
const getAllTeams = async (req, res) => {
  try {
    const teamsRef = collection(db, 'teams');
    const snapshot = await getDocs(teamsRef);
    const teams = snapshot.docs.map(doc => ({ _id: doc.id, ...doc.data() }));

    // Populate userId (we'll fetch users manually to simulate populate)
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);
    const usersDict = {};
    usersSnapshot.docs.forEach(u => {
      usersDict[u.id] = { _id: u.id, name: u.data().name, email: u.data().email };
    });

    teams.forEach(t => {
      if (t.userId && usersDict[t.userId]) {
        t.userId = usersDict[t.userId];
      }
    });

    res.json(teams);
  } catch (err) {
    console.error('getAllTeams error:', err.message);
    res.status(500).json({ message: 'Failed to fetch teams.' });
  }
};

// ── getMyTeam ──────────────────────────────────────────────────
const getMyTeam = async (req, res) => {
  try {
    const teamsRef = collection(db, 'teams');
    const q = query(teamsRef, where('userId', '==', req.user._id));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return res.status(404).json({ message: 'Team profile not found.' });
    }

    const team = { _id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
    res.json(team);
  } catch (err) {
    console.error('getMyTeam error:', err.message);
    res.status(500).json({ message: 'Failed to fetch your team profile.' });
  }
};

// ── updateLocation ─────────────────────────────────────────────
const updateLocation = async (req, res) => {
  try {
    const { lat, lng } = req.body;

    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ message: 'lat and lng are required.' });
    }

    const teamRef = doc(db, 'teams', req.params.id);
    const lastUpdated = new Date().toISOString();
    await updateDoc(teamRef, {
      currentLocation: { lat, lng },
      lastUpdated,
    });

    const teamSnap = await getDoc(teamRef);
    if (!teamSnap.exists()) {
      return res.status(404).json({ message: 'Team not found.' });
    }
    const team = { _id: teamSnap.id, ...teamSnap.data() };

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
const updateStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const validStatuses = ['Available', 'Busy', 'On Mission', 'Mission Completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value.' });
    }

    const teamRef = doc(db, 'teams', req.params.id);
    await updateDoc(teamRef, { status });

    const teamSnap = await getDoc(teamRef);
    if (!teamSnap.exists()) {
      return res.status(404).json({ message: 'Team not found.' });
    }
    const team = { _id: teamSnap.id, ...teamSnap.data() };

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
const setTeamLocation = async (req, res) => {
  try {
    const { lat, lng } = req.body;

    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ message: 'lat and lng are required.' });
    }

    const teamRef = doc(db, 'teams', req.params.id);
    const lastUpdated = new Date().toISOString();
    await updateDoc(teamRef, {
      currentLocation: { lat, lng },
      lastUpdated,
    });

    const teamSnap = await getDoc(teamRef);
    if (!teamSnap.exists()) {
      return res.status(404).json({ message: 'Team not found.' });
    }
    const team = { _id: teamSnap.id, ...teamSnap.data() };

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
const updateLocationByAuth = async (req, res) => {
  try {
    const { lat, lng } = req.body;
    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ message: 'lat and lng are required.' });
    }

    const teamsRef = collection(db, 'teams');
    const q = query(teamsRef, where('userId', '==', req.user._id));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return res.status(404).json({ message: 'Team profile not found for this user.' });
    }

    const teamId = snapshot.docs[0].id;
    const teamRef = doc(db, 'teams', teamId);
    const lastUpdated = new Date().toISOString();
    
    await updateDoc(teamRef, {
      currentLocation: { lat, lng },
      lastUpdated,
    });

    const teamSnap = await getDoc(teamRef);
    const team = { _id: teamSnap.id, ...teamSnap.data() };

    req.io.emit('teamLocationUpdated', {
      teamId:      team._id,
      name:        team.name,
      status:      team.status,
      lat,
      lng,
      lastUpdated: team.lastUpdated,
    });

    // ── FEATURE 1: AUTO MISSION COMPLETION CHECK ────────────────
    const tasksRef = collection(db, 'tasks');
    const taskQ = query(tasksRef, where('teamId', '==', team._id), where('status', 'in', ['Assigned', 'In Progress']));
    const taskSnapshot = await getDocs(taskQ);

    if (!taskSnapshot.empty) {
      const activeTaskDoc = taskSnapshot.docs[0];
      const activeTask = { _id: activeTaskDoc.id, ...activeTaskDoc.data() };

      const dist = calculateDistance(
        lat, lng, 
        activeTask.destination.lat, 
        activeTask.destination.lng
      );

      if (dist < 50) {
        await updateDoc(doc(db, 'tasks', activeTask._id), { status: 'Completed' });
        await updateDoc(teamRef, { status: 'Mission Completed' });

        req.io.emit('taskStatusUpdated', { taskId: activeTask._id, status: 'Completed' });
        req.io.emit('teamStatusUpdated', { teamId: team._id, status: 'Mission Completed' });
        
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
  updateLocationByAuth,
  updateStatus,
  setTeamLocation,
};

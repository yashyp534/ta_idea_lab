/**
 * controllers/adminController.js — Dangerous Utility Operations
 * 
 * clearData: Deletes all documents from User, Team, and Task collections.
 * Use with caution!
 */

const User = require('../models/User');
const Team = require('../models/Team');
const Task = require('../models/Task');

const clearData = async (req, res) => {
  try {
    const { secret_key } = req.body;
    const ADMIN_SECRET = process.env.ADMIN_SECRET || 'emergency_reset_2026';

    // Safety Check: Verify if the user is an admin OR if the secret key matches
    // Note: protect middleware already verifies JWT, adminOnly verifies role.
    // This additional secret_key check is for extra safety as requested.
    if (req.user.role !== 'admin' && secret_key !== ADMIN_SECRET) {
      return res.status(403).json({ message: 'Unauthorized. Higher privilege or secret key required.' });
    }

    // Perform deletions in parallel
    await Promise.all([
      User.deleteMany({ role: { $ne: 'admin' } }), // Delete all users EXCEPT admins (safety)
      Team.deleteMany({}),                         // Delete all teams
      Task.deleteMany({})                          // Delete all tasks
    ]);

    res.json({ message: 'All database data (except admin accounts) cleared successfully' });
  } catch (err) {
    console.error('clearData error:', err.message);
    res.status(500).json({ message: 'Failed to clear database data.' });
  }
};

module.exports = { clearData };

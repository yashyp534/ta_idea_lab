/**
 * controllers/adminController.js — Dangerous Utility Operations
 * 
 * clearData: Deletes all documents from User, Team, and Task collections.
 * Use with caution!
 */

const { db } = require('../firebase');
const { collection, getDocs, deleteDoc, doc, query, where } = require('firebase/firestore');

const clearData = async (req, res) => {
  try {
    const { secret_key } = req.body;
    const ADMIN_SECRET = process.env.ADMIN_SECRET || 'emergency_reset_2026';

    if (req.user.role !== 'admin' && secret_key !== ADMIN_SECRET) {
      return res.status(403).json({ message: 'Unauthorized. Higher privilege or secret key required.' });
    }

    // Delete non-admin users
    const usersQ = query(collection(db, 'users'), where('role', '!=', 'admin'));
    const usersSnap = await getDocs(usersQ);
    const userDeletions = usersSnap.docs.map(d => deleteDoc(doc(db, 'users', d.id)));

    // Delete teams
    const teamsSnap = await getDocs(collection(db, 'teams'));
    const teamDeletions = teamsSnap.docs.map(d => deleteDoc(doc(db, 'teams', d.id)));

    // Delete tasks
    const tasksSnap = await getDocs(collection(db, 'tasks'));
    const taskDeletions = tasksSnap.docs.map(d => deleteDoc(doc(db, 'tasks', d.id)));

    await Promise.all([...userDeletions, ...teamDeletions, ...taskDeletions]);

    res.json({ message: 'All database data (except admin accounts) cleared successfully' });
  } catch (err) {
    console.error('clearData error:', err.message);
    res.status(500).json({ message: 'Failed to clear database data.' });
  }
};

module.exports = { clearData };

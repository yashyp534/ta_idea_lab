/**
 * controllers/taskController.js — Task Assignment and Management
 * 
 * createTask:   Admin assigns a mission to a rescue team
 * getAllTasks:  Admin views all tasks
 * getMyTask:   Team member views their assigned task
 * updateTaskStatus: Team member marks task as In Progress / Completed
 */

const { db } = require('../firebase');
const { collection, getDocs, doc, getDoc, updateDoc, addDoc, query, where, orderBy, limit } = require('firebase/firestore');

// ── createTask ────────────────────────────────────────────────────────────────
const createTask = async (req, res) => {
  try {
    const { teamId, description, destination, severity } = req.body;

    if (!teamId || !destination || !destination.lat || !destination.lng) {
      return res.status(400).json({ message: 'teamId and destination (lat, lng) are required.' });
    }

    const teamRef = doc(db, 'teams', teamId);
    const teamSnap = await getDoc(teamRef);
    if (!teamSnap.exists()) {
      return res.status(404).json({ message: 'Team not found.' });
    }
    const team = teamSnap.data();

    const tasksRef = collection(db, 'tasks');
    const taskData = {
      teamId,
      teamName:    team.name,
      description: description || 'Emergency Response Mission',
      destination,
      severity:    severity || 'Medium',
      status:      'Assigned',
      createdAt:   new Date().toISOString(),
    };
    const taskDoc = await addDoc(tasksRef, taskData);
    const task = { _id: taskDoc.id, ...taskData };

    await updateDoc(teamRef, { status: 'On Mission' });

    req.io.emit('taskAssigned', {
      teamId,
      teamName: team.name,
      task,
    });

    res.status(201).json({ message: 'Task assigned successfully!', task });
  } catch (err) {
    console.error('createTask error:', err.message);
    res.status(500).json({ message: 'Failed to assign task.' });
  }
};

// ── getAllTasks ────────────────────────────────────────────────────────────────
const getAllTasks = async (req, res) => {
  try {
    const tasksRef = collection(db, 'tasks');
    const q = query(tasksRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    const tasks = snapshot.docs.map(doc => ({ _id: doc.id, ...doc.data() }));
    res.json(tasks);
  } catch (err) {
    console.error('getAllTasks error:', err.message);
    res.status(500).json({ message: 'Failed to fetch tasks.' });
  }
};

// ── getMyTask ─────────────────────────────────────────────────────────────────
const getMyTask = async (req, res) => {
  try {
    const tasksRef = collection(db, 'tasks');
    const q = query(tasksRef, where('teamId', '==', req.params.teamId), orderBy('createdAt', 'desc'), limit(1));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return res.status(404).json({ message: 'No task assigned yet.' });
    }

    const task = { _id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
    res.json(task);
  } catch (err) {
    console.error('getMyTask error:', err.message);
    res.status(500).json({ message: 'Failed to fetch task.' });
  }
};

// ── updateTaskStatus ──────────────────────────────────────────────────────────
const updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const validStatuses = ['Assigned', 'In Progress', 'Completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid task status.' });
    }

    const taskRef = doc(db, 'tasks', req.params.id);
    await updateDoc(taskRef, { status });
    
    const taskSnap = await getDoc(taskRef);
    if (!taskSnap.exists()) {
      return res.status(404).json({ message: 'Task not found.' });
    }
    const task = { _id: taskSnap.id, ...taskSnap.data() };

    if (status === 'Completed') {
      const teamRef = doc(db, 'teams', task.teamId);
      await updateDoc(teamRef, { status: 'Mission Completed' });
      req.io.emit('teamStatusUpdated', { teamId: task.teamId, status: 'Mission Completed' });
    }

    req.io.emit('taskStatusUpdated', { taskId: task._id, status });

    res.json({ message: 'Task status updated.', task });
  } catch (err) {
    console.error('updateTaskStatus error:', err.message);
    res.status(500).json({ message: 'Failed to update task status.' });
  }
};

// ── completeTask ─────────────────────────────────────────────────────────────
const completeTask = async (req, res) => {
  try {
    const { taskId, teamId } = req.body;

    if (!taskId || !teamId) {
      return res.status(400).json({ message: 'taskId and teamId are required.' });
    }

    const taskRef = doc(db, 'tasks', taskId);
    await updateDoc(taskRef, { status: 'Completed' });
    const taskSnap = await getDoc(taskRef);
    const task = { _id: taskSnap.id, ...taskSnap.data() };
    
    const teamRef = doc(db, 'teams', teamId);
    await updateDoc(teamRef, { status: 'Mission Completed' });

    req.io.emit('taskStatusUpdated', { taskId, status: 'Completed' });
    req.io.emit('teamStatusUpdated', { teamId, status: 'Mission Completed' });

    res.json({ message: 'Mission marked as Completed!', task });
  } catch (err) {
    console.error('completeTask error:', err.message);
    res.status(500).json({ message: 'Failed to complete mission.' });
  }
};

module.exports = { createTask, getAllTasks, getMyTask, updateTaskStatus, completeTask };

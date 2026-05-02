/**
 * controllers/taskController.js — Task Assignment and Management
 * 
 * createTask:   Admin assigns a mission to a rescue team
 * getAllTasks:  Admin views all tasks
 * getMyTask:   Team member views their assigned task
 * updateTaskStatus: Team member marks task as In Progress / Completed
 */

const Task = require('../models/Task');
const Team = require('../models/Team');

// ── createTask ────────────────────────────────────────────────────────────────
// POST /api/tasks
// Admin selects a team and sets a destination (lat, lng)
const createTask = async (req, res) => {
  try {
    const { teamId, description, destination, severity } = req.body;

    // destination = { lat, lng, label }
    if (!teamId || !destination || !destination.lat || !destination.lng) {
      return res.status(400).json({ message: 'teamId and destination (lat, lng) are required.' });
    }

    // Fetch the team to get their name for display
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: 'Team not found.' });
    }

    // Create the task in DB
    const task = await Task.create({
      teamId,
      teamName:    team.name,
      description: description || 'Emergency Response Mission',
      destination,
      severity:    severity || 'Medium',
      status:      'Assigned',
    });

    // Automatically set the team's status to "On Mission"
    await Team.findByIdAndUpdate(teamId, { status: 'On Mission' });

    // Notify all connected clients (admin + the specific team) in real-time
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
// GET /api/tasks
// Admin views all tasks with their current statuses
const getAllTasks = async (req, res) => {
  try {
    const tasks = await Task.find().sort({ createdAt: -1 }); // Newest first
    res.json(tasks);
  } catch (err) {
    console.error('getAllTasks error:', err.message);
    res.status(500).json({ message: 'Failed to fetch tasks.' });
  }
};

// ── getMyTask ─────────────────────────────────────────────────────────────────
// GET /api/tasks/mine/:teamId
// Team member sees their latest assigned task
const getMyTask = async (req, res) => {
  try {
    // Find the most recently assigned task for this team
    const task = await Task.findOne({ teamId: req.params.teamId })
      .sort({ createdAt: -1 }); // Get the latest task

    if (!task) {
      return res.status(404).json({ message: 'No task assigned yet.' });
    }

    res.json(task);
  } catch (err) {
    console.error('getMyTask error:', err.message);
    res.status(500).json({ message: 'Failed to fetch task.' });
  }
};

// ── updateTaskStatus ──────────────────────────────────────────────────────────
// PUT /api/tasks/:id/status
// Team member updates their task status
const updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const validStatuses = ['Assigned', 'In Progress', 'Completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid task status.' });
    }

    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!task) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    // If task is completed, set team status to "Mission Completed" (per new requirement)
    if (status === 'Completed') {
      await Team.findByIdAndUpdate(task.teamId, { status: 'Mission Completed' });
      req.io.emit('teamStatusUpdated', { teamId: task.teamId, status: 'Mission Completed' });
    }

    // Notify all clients about the task update
    req.io.emit('taskStatusUpdated', { taskId: task._id, status });

    res.json({ message: 'Task status updated.', task });
  } catch (err) {
    console.error('updateTaskStatus error:', err.message);
    res.status(500).json({ message: 'Failed to update task status.' });
  }
};

// ── completeTask ─────────────────────────────────────────────────────────────
// POST /api/tasks/complete
// Specific endpoint requested by user to mark a mission finished
const completeTask = async (req, res) => {
  try {
    const { taskId, teamId } = req.body;

    if (!taskId || !teamId) {
      return res.status(400).json({ message: 'taskId and teamId are required.' });
    }

    // 1. Update Task to Completed
    const task = await Task.findByIdAndUpdate(taskId, { status: 'Completed' }, { new: true });
    
    // 2. Update Team to Mission Completed (as requested)
    await Team.findByIdAndUpdate(teamId, { status: 'Mission Completed' });

    // 3. Notify clients
    req.io.emit('taskStatusUpdated', { taskId, status: 'Completed' });
    req.io.emit('teamStatusUpdated', { teamId, status: 'Mission Completed' });

    res.json({ message: 'Mission marked as Completed!', task });
  } catch (err) {
    console.error('completeTask error:', err.message);
    res.status(500).json({ message: 'Failed to complete mission.' });
  }
};

module.exports = { createTask, getAllTasks, getMyTask, updateTaskStatus, completeTask };

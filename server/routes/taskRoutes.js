/**
 * routes/taskRoutes.js — Task Assignment API Routes
 * 
 * POST /api/tasks               → Assign a task to a team (admin only)
 * GET  /api/tasks               → Get all tasks (admin only)
 * GET  /api/tasks/mine/:teamId  → Get my current task (team member)
 * PUT  /api/tasks/:id/status    → Update task status (team member)
 */

const express = require('express');
const router  = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const {
  createTask,
  getAllTasks,
  getMyTask,
  updateTaskStatus,
  completeTask, // NEW
} = require('../controllers/taskController');

// Admin: Assign a new task
router.post('/', protect, adminOnly, createTask);

// NEW: Mission Completion Endpoint (as requested)
router.post('/complete', protect, completeTask);

// Admin: View all tasks
router.get('/', protect, adminOnly, getAllTasks);

// Team member: View their latest task
router.get('/mine/:teamId', protect, getMyTask);

// Team member: Update task progress
router.put('/:id/status', protect, updateTaskStatus);

module.exports = router;

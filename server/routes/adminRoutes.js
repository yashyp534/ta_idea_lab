/**
 * routes/adminRoutes.js — Admin-only utility routes
 */

const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const { clearData } = require('../controllers/adminController');

// DELETE /api/admin/clear-data
// Protected: Requires JWT token and Admin role
router.delete('/clear-data', protect, adminOnly, clearData);

module.exports = router;

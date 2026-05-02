/**
 * routes/authRoutes.js — Authentication API Routes
 * 
 * POST /api/auth/signup     → Register a new rescue team member
 * POST /api/auth/login      → Login (admin or team)
 * POST /api/auth/seed-admin → One-time admin account creation
 */

const express = require('express');
const router  = express.Router();
const { signup, login, seedAdmin } = require('../controllers/authController');

// Public routes — no token required
router.post('/signup',     signup);
router.post('/login',      login);
router.post('/seed-admin', seedAdmin); // One-time setup, safe for POC

module.exports = router;

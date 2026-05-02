/**
 * middleware/authMiddleware.js — JWT Authentication Middleware
 * 
 * This function runs BEFORE protected route handlers.
 * It checks if the request has a valid JWT token.
 * If valid → it attaches the user info to req.user and calls next().
 * If invalid → it sends a 401 Unauthorized response.
 * 
 * Usage: router.get('/protected', protect, handler)
 *        router.get('/admin-only', protect, adminOnly, handler)
 */

const jwt  = require('jsonwebtoken');
const User = require('../models/User');

// ── protect ──────────────────────────────────────────────────────────────────
// Verifies the JWT token sent in the Authorization header.
const protect = async (req, res, next) => {
  try {
    // The token is sent as: Authorization: Bearer <token>
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided. Please login.' });
    }

    // Extract the token part (after "Bearer ")
    const token = authHeader.split(' ')[1];

    // Verify the token using our secret key
    // If the token is expired or tampered, this throws an error
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch the user from DB (excluding password) and attach to request
    // This makes req.user available in all downstream route handlers
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json({ message: 'User not found. Token is invalid.' });
    }

    next(); // Pass control to the actual route handler
  } catch (err) {
    return res.status(401).json({ message: 'Token is invalid or expired. Please login again.' });
  }
};

// ── adminOnly ─────────────────────────────────────────────────────────────────
// Must be used AFTER protect middleware.
// Restricts access to users with role 'admin'.
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Admins only.' });
  }
};

module.exports = { protect, adminOnly };

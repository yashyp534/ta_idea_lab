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

const jwt = require('jsonwebtoken');
const { db } = require('../firebase');
const { doc, getDoc } = require('firebase/firestore');

// ── protect ──────────────────────────────────────────────────────────────────
// Verifies the JWT token sent in the Authorization header.
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided. Please login.' });
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const userRef = doc(db, 'users', decoded.id);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return res.status(401).json({ message: 'User not found. Token is invalid.' });
    }

    const userData = userSnap.data();
    delete userData.password; // exclude password

    req.user = { _id: userSnap.id, ...userData };

    next();
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

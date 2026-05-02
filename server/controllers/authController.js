/**
 * controllers/authController.js — Signup and Login Logic
 * 
 * signup: Creates a new user (only role 'team'; admin is seeded separately)
 * login:  Validates credentials and returns a JWT token
 */

const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const User   = require('../models/User');
const Team   = require('../models/Team');

// ── Helper: Generate JWT Token ────────────────────────────────────────────────
// Encodes the user's _id and role into a signed token valid for 7 days
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },  // Payload stored inside the token
    process.env.JWT_SECRET,              // Secret key for signing
    { expiresIn: '7d' }                  // Token expires after 7 days
  );
};

// ── signup ────────────────────────────────────────────────────────────────────
// POST /api/auth/signup
const signup = async (req, res) => {
  try {
    const { name, email, password, lat, lng, teamType } = req.body;

    // Basic validation
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please fill in all fields.' });
    }

    // Check if email is already registered
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email is already registered.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'team',
    });

    // Save initial location if provided, else default to India center
    await Team.create({
      userId: user._id,
      name: user.name,
      teamType: teamType || 'Rescue Van',
      currentLocation: {
        lat: lat || 20.5937,
        lng: lng || 78.9629
      }
    });

    const token = generateToken(user);
    res.status(201).json({
      message: 'Account created successfully!',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('Signup error:', err.message);
    res.status(500).json({ message: 'Server error during signup.' });
  }
};

// ── login ─────────────────────────────────────────────────────────────────────
// POST /api/auth/login
// Validates email + password and returns a JWT token
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Please enter email and password.' });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password.' });
    }

    // Compare entered password with stored hash
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password.' });
    }

    // If user is a team member, fetch their team profile to send teamId
    let teamId = null;
    if (user.role === 'team') {
      const team = await Team.findOne({ userId: user._id });
      if (team) teamId = team._id;
    }

    // Generate and return token
    const token = generateToken(user);
    res.json({
      message: 'Login successful!',
      token,
      user: {
        id:     user._id,
        name:   user.name,
        email:  user.email,
        role:   user.role,
        teamId, // null for admin, ObjectId for team members
      },
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ message: 'Server error during login.' });
  }
};

// ── seedAdmin ─────────────────────────────────────────────────────────────────
// POST /api/auth/seed-admin
// One-time endpoint to create the admin account
// In production you'd remove this, but for a POC it's fine
const seedAdmin = async (req, res) => {
  try {
    // Check if admin already exists
    const existing = await User.findOne({ role: 'admin' });
    if (existing) {
      return res.status(400).json({ message: 'Admin account already exists.' });
    }

    const hashedPassword = await bcrypt.hash('admin123', 10);
    const admin = await User.create({
      name:     'Admin',
      email:    'admin@rescue.com',
      password: hashedPassword,
      role:     'admin',
    });

    res.status(201).json({
      message:  'Admin account created!',
      email:    admin.email,
      password: 'admin123',  // Only shown once — for demo purposes
    });
  } catch (err) {
    console.error('Seed admin error:', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { signup, login, seedAdmin };

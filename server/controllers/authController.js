/**
 * controllers/authController.js — Signup and Login Logic
 * 
 * signup: Creates a new user (only role 'team'; admin is seeded separately)
 * login:  Validates credentials and returns a JWT token
 */

const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const { db } = require('../firebase');
const { collection, getDocs, query, where, addDoc } = require('firebase/firestore');

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
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      return res.status(400).json({ message: 'Email is already registered.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const docRef = await addDoc(usersRef, {
      name,
      email,
      password: hashedPassword,
      role: 'team',
    });

    const user = { _id: docRef.id, name, email, role: 'team' };

    // Save initial location if provided, else default to India center
    const teamsRef = collection(db, 'teams');
    await addDoc(teamsRef, {
      userId: user._id,
      name: user.name,
      teamType: teamType || 'Rescue Van',
      status: 'Available',
      lastUpdated: new Date().toISOString(),
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
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return res.status(400).json({ message: 'Invalid email or password.' });
    }

    const userDoc = querySnapshot.docs[0];
    const user = { _id: userDoc.id, ...userDoc.data() };

    // Compare entered password with stored hash
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password.' });
    }

    // If user is a team member, fetch their team profile to send teamId
    let teamId = null;
    if (user.role === 'team') {
      const teamsRef = collection(db, 'teams');
      const teamQ = query(teamsRef, where('userId', '==', user._id));
      const teamSnapshot = await getDocs(teamQ);
      if (!teamSnapshot.empty) {
        teamId = teamSnapshot.docs[0].id;
      }
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
        teamId, // null for admin, string for team members
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
const seedAdmin = async (req, res) => {
  try {
    // Check if admin already exists
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('role', '==', 'admin'));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      return res.status(400).json({ message: 'Admin account already exists.' });
    }

    const hashedPassword = await bcrypt.hash('admin123', 10);
    const docRef = await addDoc(usersRef, {
      name:     'Admin',
      email:    'admin@rescue.com',
      password: hashedPassword,
      role:     'admin',
    });

    const admin = { _id: docRef.id, email: 'admin@rescue.com' };

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

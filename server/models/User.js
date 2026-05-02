/**
 * models/User.js — Mongoose Schema for Users
 * 
 * Stores all users (Admin + Rescue Teams) in MongoDB.
 * Passwords are stored as bcrypt hashes — NEVER plain text.
 */

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    // Full name of the user
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,                // Remove leading/trailing whitespace
    },

    // Email used for login — must be unique across all users
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,           // Store emails in lowercase to avoid duplicates
      trim: true,
    },

    // Hashed password (we hash it before saving in the auth controller)
    password: {
      type: String,
      required: [true, 'Password is required'],
    },

    // Role determines what the user can see and do
    // 'admin' can view all teams, assign tasks
    // 'team'  can update their own location and status
    role: {
      type: String,
      enum: ['admin', 'team'],  // Only these two values are allowed
      default: 'team',
    },
  },
  {
    timestamps: true,           // Adds createdAt and updatedAt fields automatically
  }
);

module.exports = mongoose.model('User', userSchema);

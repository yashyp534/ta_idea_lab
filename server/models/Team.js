/**
 * models/Team.js — Mongoose Schema for Rescue Teams
 * 
 * UPDATED: Added `lastUpdated` timestamp field to track
 * when the team last sent a location ping. Useful for
 * detecting stale/offline teams on the dashboard.
 */

const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema(
  {
    // Link this team profile to a User account
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },

    // Team's display name (copied from User.name for convenience)
    name: {
      type: String,
      required: true,
    },

    // Current GPS location of the team
    currentLocation: {
      lat: { type: Number, default: 20.5937 },  // Default: center of India
      lng: { type: Number, default: 78.9629 },
    },

    // Current operational status
    status: {
      type: String,
      enum: ['Available', 'Busy', 'On Mission', 'Mission Completed'],
      default: 'Available',
    },

    // NEW: Type of rescue unit (affects map icon)
    teamType: {
      type: String,
      enum: ['Ambulance', 'Fire Truck', 'Police', 'Rescue Van'],
      default: 'Rescue Van',
    },

    // NEW: When was the location last updated?
    // Used to show "last seen X minutes ago" on the admin map
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, // Adds createdAt + updatedAt automatically
  }
);

module.exports = mongoose.model('Team', teamSchema);

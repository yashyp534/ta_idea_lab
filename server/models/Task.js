/**
 * models/Task.js — Mongoose Schema for Tasks
 * 
 * Represents a mission/task assigned by an Admin to a Rescue Team.
 * Stores the destination coordinates and current task status.
 */

const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    // Which team this task is assigned to
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      required: true,
    },

    // Team name stored for easy display (denormalized for performance)
    teamName: {
      type: String,
      required: true,
    },

    // Task description / title
    description: {
      type: String,
      default: 'Emergency Response Mission',
    },

    // The GPS coordinates of the destination the team must go to
    destination: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
      // Optional label for the destination (e.g., "Village X", "Hospital Y")
      label: { type: String, default: 'Mission Location' },
    },

    // Status of the task
    status: {
      type: String,
      enum: ['Assigned', 'In Progress', 'Completed'],
      default: 'Assigned',
    },

    // NEW: Mission Priority
    severity: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium',
    },
  },
  {
    timestamps: true, // createdAt tells us when the task was assigned
  }
);

module.exports = mongoose.model('Task', taskSchema);

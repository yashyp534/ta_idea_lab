/**
 * clearDB.js — Standalone Database Cleanup Script
 * 
 * Usage: node clearDB.js
 * 
 * This script connects directly to MongoDB Atlas and wipes all data
 * from the Users, Teams, and Tasks collections.
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Import Models
const User = require('./models/User');
const Team = require('./models/Team');
const Task = require('./models/Task');

const clearDatabase = async () => {
  try {
    const MONGO_URI = process.env.MONGO_URI;
    if (!MONGO_URI) {
      console.error('ERROR: MONGO_URI not found in .env file');
      process.exit(1);
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected successfully.');

    console.log('Cleaning collections...');
    
    // Delete documents
    const userResult = await User.deleteMany({ role: { $ne: 'admin' } });
    const teamResult = await Team.deleteMany({});
    const taskResult = await Task.deleteMany({});

    console.log(`----------------------------------`);
    console.log(`✅ SUCCESS: Database cleared.`);
    console.log(`- Users deleted: ${userResult.deletedCount}`);
    console.log(`- Teams deleted: ${teamResult.deletedCount}`);
    console.log(`- Tasks deleted: ${taskResult.deletedCount}`);
    console.log(`----------------------------------`);
    console.log(`Note: Admin accounts were preserved for safety.`);

    process.exit(0);
  } catch (err) {
    console.error('Cleanup failed:', err.message);
    process.exit(1);
  }
};

clearDatabase();

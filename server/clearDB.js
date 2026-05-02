/**
 * clearDB.js — Standalone Database Cleanup Script
 * 
 * Usage: node clearDB.js
 * 
 * This script connects directly to Firebase Firestore and wipes all data
 * from the Users (except admin), Teams, and Tasks collections.
 */

require('dotenv').config();
const { db } = require('./firebase');
const { collection, getDocs, deleteDoc, doc, query, where } = require('firebase/firestore');

const clearDatabase = async () => {
  try {
    console.log('Connecting to Firebase Firestore...');

    console.log('Cleaning collections...');
    
    // Delete users except admin
    const usersQ = query(collection(db, 'users'), where('role', '!=', 'admin'));
    const usersSnap = await getDocs(usersQ);
    const userDeletions = usersSnap.docs.map(d => deleteDoc(doc(db, 'users', d.id)));

    // Delete teams
    const teamsSnap = await getDocs(collection(db, 'teams'));
    const teamDeletions = teamsSnap.docs.map(d => deleteDoc(doc(db, 'teams', d.id)));

    // Delete tasks
    const tasksSnap = await getDocs(collection(db, 'tasks'));
    const taskDeletions = tasksSnap.docs.map(d => deleteDoc(doc(db, 'tasks', d.id)));

    await Promise.all([...userDeletions, ...teamDeletions, ...taskDeletions]);

    console.log(`----------------------------------`);
    console.log(`✅ SUCCESS: Database cleared.`);
    console.log(`- Users deleted: ${userDeletions.length}`);
    console.log(`- Teams deleted: ${teamDeletions.length}`);
    console.log(`- Tasks deleted: ${taskDeletions.length}`);
    console.log(`----------------------------------`);
    console.log(`Note: Admin accounts were preserved for safety.`);

    process.exit(0);
  } catch (err) {
    console.error('Cleanup failed:', err.message);
    process.exit(1);
  }
};

clearDatabase();

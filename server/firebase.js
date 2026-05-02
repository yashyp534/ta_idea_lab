const { initializeApp } = require("firebase/app");
const { getFirestore } = require("firebase/firestore");

const firebaseConfig = {
  apiKey: "AIzaSyBHNeoPihzEHCvR5NtOncReB8YWptDCNCY",
  authDomain: "attendance-system-26d41.firebaseapp.com",
  databaseURL: "https://attendance-system-26d41-default-rtdb.firebaseio.com",
  projectId: "attendance-system-26d41",
  storageBucket: "attendance-system-26d41.firebasestorage.app",
  messagingSenderId: "836745480729",
  appId: "1:836745480729:web:e5da3ef8b186d13ab8f888",
  measurementId: "G-78DYT80CRF"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

module.exports = { db };

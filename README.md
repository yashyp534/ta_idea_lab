# Real-Time Tracking and Coordination of Rescue Teams

This is a complete full-stack Proof of Concept (POC) project built for a 2nd-year Computer Engineering student. It solves the problem of poor coordination and tracking of rescue teams during disasters by providing a real-time, map-based dashboard.

## 🚀 Project Overview

**Problem Solved:** Absence of real-time tracking of rescue teams leads to poor coordination and delays during disasters.
**Solution:** A web application where Rescue Teams broadcast their live location, and an Admin can see all teams on a map, assign missions, and track their operational status in real-time.

### Tech Stack
*   **Frontend:** React, React Router, Leaflet.js (Maps), Socket.io-client, plain CSS (Dark Theme/Glassmorphism).
*   **Backend:** Node.js, Express.js, Socket.io (Real-time WebSockets), JWT (Authentication).
*   **Database:** MongoDB Atlas (Mongoose ORM).

---

## 📂 Folder Structure

```text
IDEA_LAB_FINAL_PROJECT/
│
├── client/                 # React Frontend
│   ├── public/             # HTML entry point
│   ├── src/
│   │   ├── components/     # Reusable UI (MapView, TaskAssignModal, Notification)
│   │   ├── context/        # Global State (AuthContext)
│   │   ├── pages/          # Full pages (Login, Signup, AdminDashboard, TeamDashboard)
│   │   ├── services/       # API and Socket connection logic (api.js, socket.js)
│   │   ├── utils/          # Map helpers and color constants
│   │   ├── App.js          # Main React Router setup
│   │   ├── index.js        # React DOM render
│   │   └── index.css       # Global design system variables
│   └── package.json        # Frontend dependencies
│
└── server/                 # Node.js + Express Backend
    ├── controllers/        # Business logic (authController, teamController, taskController)
    ├── middleware/         # Security (authMiddleware - JWT validation)
    ├── models/             # MongoDB Schemas (User, Team, Task)
    ├── routes/             # API Endpoints (authRoutes, teamRoutes, taskRoutes)
    ├── .env.example        # Environment variables template
    ├── index.js            # Main Express server + Socket.io initialization
    └── package.json        # Backend dependencies
```

---

## 🛠 MongoDB Setup Guide

1.  Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) and create a free account.
2.  Create a **New Project** and then build a **Free Cluster (M0)**.
3.  Under **Database Access**, create a new database user with a username and password. Remember this password!
4.  Under **Network Access**, add an IP Address. Select **Allow Access from Anywhere** (`0.0.0.0/0`) for development.
5.  Go to **Database**, click **Connect**, then choose **Drivers** (Node.js).
6.  Copy the connection string provided. It will look something like this:
    `mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`
7.  Replace `<password>` with the password you created in step 3. Also, add the database name you want before the `?`, e.g., `...mongodb.net/disasterResponse?retryWrites...`

---

## ⚙️ Setup Instructions

### 1. Backend Setup
1.  Open a terminal and navigate to the `server` folder:
    `cd server`
2.  Install dependencies:
    `npm install`
3.  Rename `.env.example` to `.env`.
4.  Open `.env` and paste your **MongoDB Connection String** into the `MONGO_URI` variable. Set `JWT_SECRET` to any random string.
5.  Start the server:
    `npm run dev`
    *You should see "✅ Connected to MongoDB Atlas" and "🚀 Server running on http://localhost:5000".*

### 2. Frontend Setup
1.  Open a **new** terminal and navigate to the `client` folder:
    `cd client`
2.  Install dependencies:
    `npm install`
3.  Start the React app:
    `npm start`
    *The app will open automatically in your browser at http://localhost:3000.*

---

## 🏃‍♂️ How to Run & Demo the Project

### Step 1: Create the Admin Account (One-Time)
Since we disabled Admin signup for security, you need to trigger the seed script once.
Open a new terminal or use Postman/cURL to send a POST request:
`curl -X POST http://localhost:5000/api/auth/seed-admin`

### Step 2: Log In as Admin
*   **Email:** `admin@rescue.com`
*   **Password:** `admin123`
*   *You will see the Admin Dashboard with an empty map.*

### Step 3: Create a Rescue Team (Simulate another user)
*   Open an **Incognito Window** or a different browser (e.g., Firefox).
*   Go to `http://localhost:3000/signup`.
*   Create a team (e.g., "Alpha Rescue", email: "alpha@rescue.com", pass: "123456").
*   *You are now on the Team Dashboard.*

### Step 4: The Live Demo
1.  **Look at the Admin Screen:** You will immediately see the new team appear on the map as a green marker.
2.  **Team Screen:** Change the status to "Busy".
3.  **Admin Screen:** The marker turns yellow instantly.
4.  **Admin Screen:** Click "+ Assign" on the team in the sidebar. Click anywhere on the map to select a destination, type a description, and assign the mission.
5.  **Team Screen:** A notification pops up! The mission details appear. Click "Start Mission".
6.  **Admin Screen:** A dashed line is drawn from the team to the destination.
7.  **Team Screen:** Click **"Start GPS Simulation"**.
8.  **Admin Screen:** Watch the marker literally move across the map in real-time as the simulation sends GPS updates via WebSockets!

---

## 🎓 Viva Explanation (Simple Language)

If the examiner asks you to explain the project:

**"What is this project?"**
"Sir/Madam, this is a Real-Time Disaster Response Dashboard. It tracks rescue teams live on a map so that the command center can assign emergency missions efficiently."

**"What is the Tech Stack?"**
"I used the MERN stack. React for the frontend, Node.js and Express for the backend, and MongoDB Atlas as the cloud database. For the maps, I used Leaflet.js."

**"How does the real-time tracking work?"**
"I used WebSockets specifically a library called **Socket.io**. Instead of the client constantly asking the server 'Where is the team?', the server pushes the location to the Admin map the exact millisecond the team moves. This avoids delay and saves server resources."

**"How is security handled?"**
"I implemented JWT (JSON Web Tokens). Passwords are never saved in plain text; they are hashed using **Bcrypt**. Only an authenticated Admin can assign tasks, and teams can only update their own locations."

**"What makes this a Proof of Concept?"**
"It demonstrates the core functionality: live tracking and two-way communication. For a production app, we would add actual hardware GPS integrations, complex role hierarchies, and route optimization algorithms. For this POC, I built a GPS simulator to prove the Socket.io logic works."

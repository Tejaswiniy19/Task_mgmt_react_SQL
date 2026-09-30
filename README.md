# TaskForge 2.0

A premium intelligent productivity dashboard built with React, Express, MySQL and a Node.js Worker Thread.

## Included features

1. Registration and login
2. bcrypt password hashing
3. JWT authentication
4. Protected routes
5. User-specific tasks
6. Task CRUD (create, complete, delete)
7. Priority levels
8. Estimated effort
9. Deadlines
10. Categories
11. Search and filters
12. Worker Thread Focus Engine
13. Explainable next-best-task recommendation
14. Focus sessions / timer
15. XP and levels
16. Productivity streaks
17. Analytics dashboard
18. Weekly completion data
19. Smart workload alerts
20. Premium responsive UI, animations and theme switching

## Setup

### 1. Database

Open MySQL Workbench and run `database.sql`.

If you already have an older TaskForge/student-task-manager database, back it up first. The new schema is designed for a fresh TaskForge 2.0 database.

### 2. Backend

```powershell
cd backend
npm install
copy .env.example .env
```

Open `.env` and set your MySQL password and a private JWT secret.

Then:

```powershell
npm start
```

Expected:

```text
MySQL Connected
Backend running at http://localhost:5000
```

### 3. Frontend

Open another terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

## Important security note

This demo uses a bearer JWT stored by the frontend for simplicity. For production, prefer short-lived access tokens with secure, httpOnly cookies and add rate limiting, CSRF protection as appropriate, HTTPS, and stronger server-side validation.

## Architecture

React
  -> Express API
  -> MySQL

React
  -> /task-intelligence
  -> Express
  -> Worker Thread
  -> explainable Focus Engine
  -> React

React
  -> /focus-sessions
  -> MySQL
  -> XP / streak update
  -> Analytics

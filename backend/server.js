const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const path = require("path");
const { Worker } = require("worker_threads");
require("dotenv").config();

const db = require("./db");

const app = express();
const PORT = Number(process.env.PORT || 5000);
const JWT_SECRET = process.env.JWT_SECRET || "dev-only-change-this-secret";

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json({ limit: "1mb" }));

function signToken(user) {
  return jwt.sign(
    { userId: user.id, email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: "2h" }
  );
}

function authenticateToken(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Authentication required" });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(403).json({ error: "Invalid or expired token" });
  }
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function validateTask(body) {
  const title = String(body.title || "").trim();
  const priority = ["High", "Medium", "Low"].includes(body.priority) ? body.priority : "Medium";
  const category = String(body.category || "General").trim().slice(0, 40) || "General";
  const estimated = Math.min(600, Math.max(5, Number(body.estimated_minutes) || 30));
  const description = String(body.description || "").trim().slice(0, 1000);
  const deadline = body.deadline ? new Date(body.deadline) : null;
  return { title, priority, category, estimated, description, deadline };
}

async function awardActivity(userId, xpGain) {
  const [rows] = await db.query("SELECT xp, current_streak, last_activity_date FROM users WHERE id = ?", [userId]);
  if (!rows.length) return;
  const user = rows[0];
  const today = new Date();
  const todayKey = today.toISOString().slice(0, 10);
  const last = user.last_activity_date ? new Date(user.last_activity_date).toISOString().slice(0, 10) : null;
  let streak = Number(user.current_streak) || 0;
  if (last !== todayKey) {
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayKey = yesterday.toISOString().slice(0, 10);
    streak = last === yesterdayKey ? streak + 1 : 1;
  }
  await db.query(
    "UPDATE users SET xp = xp + ?, current_streak = ?, last_activity_date = ? WHERE id = ?",
    [xpGain, streak, todayKey, userId]
  );
}

app.get("/health", (_req, res) => res.json({ ok: true, service: "TaskForge API" }));

// ---------------- AUTH ----------------
app.post("/auth/register", async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || "");
    if (name.length < 2) return res.status(400).json({ error: "Name must contain at least 2 characters" });
    if (!email.includes("@")) return res.status(400).json({ error: "Enter a valid email" });
    if (password.length < 6) return res.status(400).json({ error: "Password must contain at least 6 characters" });
    const hash = await bcrypt.hash(password, 12);
    const [result] = await db.query(
      "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
      [name, email, hash]
    );
    res.status(201).json({ message: "Registration successful", userId: result.insertId });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") return res.status(409).json({ error: "Email already registered" });
    res.status(500).json({ error: "Registration failed" });
  }
});

app.post("/auth/login", async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || "");
    const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
    if (!rows.length) return res.status(401).json({ error: "Invalid email or password" });
    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: "Invalid email or password" });
    const safeUser = { id: user.id, name: user.name, email: user.email, xp: user.xp, current_streak: user.current_streak };
    res.json({ token: signToken(safeUser), user: safeUser });
  } catch {
    res.status(500).json({ error: "Login failed" });
  }
});

app.get("/auth/me", authenticateToken, async (req, res) => {
  const [rows] = await db.query(
    "SELECT id, name, email, xp, current_streak, created_at FROM users WHERE id = ?",
    [req.user.userId]
  );
  if (!rows.length) return res.status(404).json({ error: "User not found" });
  res.json(rows[0]);
});

// ---------------- TASKS ----------------
app.get("/tasks", authenticateToken, async (req, res) => {
  try {
    const search = String(req.query.search || "").trim();
    const status = req.query.status && req.query.status !== "All" ? req.query.status : null;
    const priority = req.query.priority && req.query.priority !== "All" ? req.query.priority : null;
    const category = req.query.category && req.query.category !== "All" ? req.query.category : null;
    const params = [req.user.userId];
    let sql = "SELECT * FROM tasks WHERE user_id = ?";
    if (search) { sql += " AND (title LIKE ? OR description LIKE ?)"; params.push(`%${search}%`, `%${search}%`); }
    if (status) { sql += " AND status = ?"; params.push(status); }
    if (priority) { sql += " AND priority = ?"; params.push(priority); }
    if (category) { sql += " AND category = ?"; params.push(category); }
    sql += " ORDER BY CASE WHEN status = 'Pending' THEN 0 ELSE 1 END, deadline IS NULL, deadline ASC, id DESC";
    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/tasks", authenticateToken, async (req, res) => {
  try {
    const { title, priority, category, estimated, description, deadline } = validateTask(req.body);
    if (!title) return res.status(400).json({ error: "Task title is required" });
    if (title.length > 100) return res.status(400).json({ error: "Task title is too long" });
    const deadlineValue = deadline && !Number.isNaN(deadline.getTime()) ? deadline : null;
    const [result] = await db.query(
      `INSERT INTO tasks (user_id, title, description, status, priority, category, estimated_minutes, deadline)
       VALUES (?, ?, ?, 'Pending', ?, ?, ?, ?)`,
      [req.user.userId, title, description, priority, category, estimated, deadlineValue]
    );
    res.status(201).json({ message: "Mission created", id: result.insertId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.patch("/tasks/:id/complete", authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, priority, status FROM tasks WHERE id = ? AND user_id = ?",
      [req.params.id, req.user.userId]
    );
    if (!rows.length) return res.status(404).json({ error: "Task not found" });
    if (rows[0].status === "Completed") return res.json({ message: "Task already completed" });
    const xp = rows[0].priority === "High" ? 50 : rows[0].priority === "Medium" ? 30 : 15;
    await db.query("UPDATE tasks SET status = 'Completed', completed_at = NOW() WHERE id = ? AND user_id = ?", [req.params.id, req.user.userId]);
    await awardActivity(req.user.userId, xp);
    res.json({ message: "Mission completed", xpAwarded: xp });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/tasks/:id", authenticateToken, async (req, res) => {
  try {
    const [result] = await db.query("DELETE FROM tasks WHERE id = ? AND user_id = ?", [req.params.id, req.user.userId]);
    if (!result.affectedRows) return res.status(404).json({ error: "Task not found" });
    res.json({ message: "Mission deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ---------------- WORKER INTELLIGENCE ----------------
app.get("/task-intelligence", authenticateToken, async (req, res) => {
  try {
    const [tasks] = await db.query("SELECT * FROM tasks WHERE user_id = ?", [req.user.userId]);
    const worker = new Worker(path.join(__dirname, "worker.js"), { workerData: tasks });
    worker.once("message", (result) => res.json(result));
    worker.once("error", (error) => res.status(500).json({ error: error.message }));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ---------------- FOCUS SESSIONS ----------------
app.post("/focus-sessions", authenticateToken, async (req, res) => {
  try {
    const taskId = Number(req.body.taskId);
    const durationSeconds = Math.max(0, Number(req.body.durationSeconds) || 0);
    if (!taskId || durationSeconds < 60) return res.status(400).json({ error: "A valid focus session is required" });
    const [taskRows] = await db.query("SELECT id FROM tasks WHERE id = ? AND user_id = ?", [taskId, req.user.userId]);
    if (!taskRows.length) return res.status(404).json({ error: "Task not found" });
    await db.query(
      "INSERT INTO focus_sessions (user_id, task_id, duration_seconds, started_at, completed_at) VALUES (?, ?, ?, DATE_SUB(NOW(), INTERVAL ? SECOND), NOW())",
      [req.user.userId, taskId, durationSeconds, durationSeconds]
    );
    await awardActivity(req.user.userId, 25);
    res.json({ message: "Focus session recorded", xpAwarded: 25 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ---------------- ANALYTICS ----------------
app.get("/analytics", authenticateToken, async (req, res) => {
  try {
    const uid = req.user.userId;
    const [[summary]] = await db.query(`
      SELECT
        COUNT(*) total,
        SUM(status = 'Completed') completed,
        SUM(status = 'Pending') pending,
        COALESCE(SUM(CASE WHEN status = 'Completed' THEN estimated_minutes ELSE 0 END),0) completed_minutes,
        COALESCE(SUM(CASE WHEN status = 'Pending' THEN estimated_minutes ELSE 0 END),0) pending_minutes
      FROM tasks WHERE user_id = ?`, [uid]);
    const [[focus]] = await db.query(`SELECT COALESCE(SUM(duration_seconds),0) focus_seconds FROM focus_sessions WHERE user_id = ?`, [uid]);
    const [daily] = await db.query(`
      SELECT DATE(completed_at) day, COUNT(*) completed
      FROM tasks
      WHERE user_id = ? AND completed_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
      GROUP BY DATE(completed_at) ORDER BY day ASC`, [uid]);
    const [categories] = await db.query(`SELECT category, COUNT(*) count FROM tasks WHERE user_id = ? GROUP BY category ORDER BY count DESC`, [uid]);
    const [recent] = await db.query(`SELECT id, title, priority, category, estimated_minutes, completed_at FROM tasks WHERE user_id = ? AND status = 'Completed' ORDER BY completed_at DESC LIMIT 8`, [uid]);
    const [userRows] = await db.query("SELECT xp, current_streak FROM users WHERE id = ?", [uid]);
    const user = userRows[0] || { xp: 0, current_streak: 0 };
    const total = Number(summary.total) || 0;
    const completed = Number(summary.completed) || 0;
    const level = Math.floor(Number(user.xp || 0) / 250) + 1;
    res.json({
      total,
      completed,
      pending: Number(summary.pending) || 0,
      completionRate: total ? Math.round((completed / total) * 100) : 0,
      completedMinutes: Number(summary.completed_minutes) || 0,
      pendingMinutes: Number(summary.pending_minutes) || 0,
      focusMinutes: Math.round((Number(focus.focus_seconds) || 0) / 60),
      xp: Number(user.xp) || 0,
      level,
      streak: Number(user.current_streak) || 0,
      daily,
      categories,
      recent
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});

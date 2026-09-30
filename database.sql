CREATE DATABASE IF NOT EXISTS taskforge;
USE taskforge;

-- TaskForge 2.0 schema.
-- If you already have the old demo database, BACK IT UP before running this file.

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  xp INT NOT NULL DEFAULT 0,
  current_streak INT NOT NULL DEFAULT 0,
  last_activity_date DATE NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  title VARCHAR(100) NOT NULL,
  description VARCHAR(1000) DEFAULT '',
  status ENUM('Pending','Completed') NOT NULL DEFAULT 'Pending',
  priority ENUM('High','Medium','Low') NOT NULL DEFAULT 'Medium',
  category VARCHAR(40) NOT NULL DEFAULT 'General',
  estimated_minutes INT NOT NULL DEFAULT 30,
  deadline DATETIME NULL,
  completed_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_tasks_user (user_id),
  INDEX idx_tasks_deadline (deadline),
  CONSTRAINT fk_tasks_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS focus_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  task_id INT NOT NULL,
  duration_seconds INT NOT NULL,
  started_at DATETIME NOT NULL,
  completed_at DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_focus_user (user_id),
  CONSTRAINT fk_focus_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_focus_task FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

-- These inserts are intentionally not included so every task belongs to a real account.
-- Register through the app, then create missions from the dashboard.

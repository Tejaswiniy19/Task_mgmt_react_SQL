const { parentPort, workerData } = require("worker_threads");

const tasks = Array.isArray(workerData) ? workerData : [];

const priorityWeight = { High: 40, Medium: 25, Low: 10 };

function hoursUntil(deadline) {
  if (!deadline) return null;
  const diff = new Date(deadline).getTime() - Date.now();
  return diff / (1000 * 60 * 60);
}

function urgencyScore(deadline) {
  const hours = hoursUntil(deadline);
  if (hours === null) return 0;
  if (hours <= 0) return 35;
  if (hours <= 24) return 32;
  if (hours <= 48) return 25;
  if (hours <= 72) return 18;
  if (hours <= 168) return 10;
  return 4;
}

function effortScore(minutes) {
  const value = Number(minutes) || 30;
  if (value <= 30) return 18;
  if (value <= 60) return 14;
  if (value <= 120) return 9;
  return 5;
}

function buildReason(task, score) {
  const reasons = [];
  if (task.priority === "High") reasons.push("High priority");
  if (task.deadline && hoursUntil(task.deadline) <= 48) reasons.push("Deadline approaching");
  if ((Number(task.estimated_minutes) || 30) <= 30) reasons.push("Quick win");
  if (!reasons.length) reasons.push("Good fit for your current queue");
  return reasons;
}

const pending = tasks
  .filter((task) => task.status === "Pending")
  .map((task) => {
    const priority = priorityWeight[task.priority] || 10;
    const urgency = urgencyScore(task.deadline);
    const effort = effortScore(task.estimated_minutes);
    const score = Math.min(100, priority + urgency + effort);
    return {
      ...task,
      focusScore: score,
      urgencyScore: urgency,
      why: buildReason(task, score)
    };
  })
  .sort((a, b) => b.focusScore - a.focusScore);

const total = tasks.length;
const completed = tasks.filter((task) => task.status === "Completed").length;
const pendingCount = tasks.filter((task) => task.status === "Pending").length;
const completionRate = total ? Math.round((completed / total) * 100) : 0;
const pendingMinutes = pending.reduce((sum, task) => sum + (Number(task.estimated_minutes) || 0), 0);

let workloadLevel = "Light";
if (pendingMinutes > 240) workloadLevel = "Heavy";
else if (pendingMinutes > 120) workloadLevel = "Moderate";

parentPort.postMessage({
  total,
  completed,
  pending: pendingCount,
  completionRate,
  pendingMinutes,
  workloadLevel,
  recommendedTask: pending[0] || null,
  rankedTasks: pending.slice(0, 8)
});

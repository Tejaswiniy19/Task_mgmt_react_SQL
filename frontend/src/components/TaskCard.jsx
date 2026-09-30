import React from "react";
function deadlineText(deadline) {
  if (!deadline) return "No deadline";
  const date = new Date(deadline);
  const diff = date.getTime() - Date.now();
  if (diff < 0) return "Overdue";
  const hours = Math.ceil(diff / 3600000);
  if (hours <= 24) return `Due in ${hours}h`;
  return `Due ${date.toLocaleDateString([], { month: "short", day: "numeric" })}`;
}

export default function TaskCard({ task, onComplete, onDelete, onFocus }) {
  const priority = (task.priority || "Medium").toLowerCase();
  return (
    <article className={`task-card ${task.status === "Completed" ? "is-complete" : ""}`}>
      <div className="task-check">{task.status === "Completed" ? "✓" : ""}</div>
      <div className="task-main">
        <div className="task-title-row">
          <h3>{task.title}</h3>
          <span className={`priority-badge ${priority}`}>{task.priority}</span>
        </div>
        {task.description && <p className="task-description">{task.description}</p>}
        <div className="task-meta">
          <span>{task.category}</span><span>•</span><span>{task.estimated_minutes} min</span><span>•</span><span className={deadlineText(task.deadline) === "Overdue" ? "danger-text" : ""}>{deadlineText(task.deadline)}</span>
        </div>
      </div>
      <div className="task-actions">
        {task.status === "Pending" && <button className="ghost-btn" onClick={() => onFocus(task)}>Focus</button>}
        {task.status === "Pending" && <button className="complete-btn" onClick={() => onComplete(task.id)}>Complete</button>}
        <button className="delete-btn" onClick={() => onDelete(task.id)} title="Delete mission">×</button>
      </div>
    </article>
  );
}

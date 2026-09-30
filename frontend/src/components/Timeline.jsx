import React from "react";
function formatDate(value) {
  if (!value) return "No deadline";
  return new Date(value).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export default function Timeline({ tasks }) {
  const items = [...tasks].filter((t) => t.status === "Pending" && t.deadline).sort((a, b) => new Date(a.deadline) - new Date(b.deadline)).slice(0, 6);
  return <section className="timeline-card"><div className="section-heading compact"><div><span className="eyebrow">MISSION TIMELINE</span><h2>Upcoming schedule</h2></div></div>{items.length ? <div className="timeline">{items.map((task) => <div className="timeline-item" key={task.id}><div className="timeline-line" /><div className="timeline-dot" /><div><strong>{task.title}</strong><span>{formatDate(task.deadline)} · {task.estimated_minutes} min</span></div></div>)}</div> : <p className="muted">Add deadlines to turn your queue into a timeline.</p>}</section>;
}

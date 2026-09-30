
import React from "react";
export default function Stats({ intelligence, analytics }) {
  const items = [
    ["Total missions", intelligence?.total || 0, "Your active workspace"],
    ["Pending", intelligence?.pending || 0, `${intelligence?.pendingMinutes || 0} min queued`],
    ["Completed", intelligence?.completed || 0, "Missions finished"],
    ["Completion", `${intelligence?.completionRate || 0}%`, "Overall progress"],
    ["Focus time", `${analytics?.focusMinutes || 0}m`, "Recorded sessions"],
    ["Streak", `${analytics?.streak || 0} days`, "Consistency"],
  ];
  return <div className="stats-grid">{items.map(([label, value, desc]) => (
    <article className="stat-card" key={label}><span className="stat-label">{label}</span><strong className="stat-value">{value}</strong><span className="stat-description">{desc}</span></article>
  ))}</div>;
}

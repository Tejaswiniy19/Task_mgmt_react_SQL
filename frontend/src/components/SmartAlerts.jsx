import React from "react";
function getAlerts(tasks = []) {
  const now = Date.now();
  const alerts = [];
  const overdue = tasks.filter((t) => t.status === "Pending" && t.deadline && new Date(t.deadline).getTime() < now);
  const soon = tasks.filter((t) => t.status === "Pending" && t.deadline && new Date(t.deadline).getTime() >= now && new Date(t.deadline).getTime() - now <= 48 * 3600000);
  if (overdue.length) alerts.push({ type: "danger", title: `${overdue.length} mission${overdue.length > 1 ? "s" : ""} overdue`, text: "Resolve the oldest deadline before adding more workload." });
  if (soon.length) alerts.push({ type: "warning", title: `${soon.length} deadline${soon.length > 1 ? "s" : ""} approaching`, text: "The Focus Engine has increased their urgency." });
  if (!overdue.length && !soon.length && tasks.some((t) => t.status === "Pending")) alerts.push({ type: "good", title: "Workspace looks balanced", text: "No urgent deadline alerts right now." });
  return alerts;
}

export default function SmartAlerts({ tasks }) {
  const alerts = getAlerts(tasks);
  const enable = async () => {
    if (!("Notification" in window)) return alert("Browser notifications are not supported here.");
    const permission = await Notification.requestPermission();
    if (permission === "granted") new Notification("TaskForge", { body: "Smart alerts are enabled for this session." });
  };
  if (!alerts.length) return null;
  return <section className="alerts-panel"><div className="section-heading compact"><div><span className="eyebrow">SMART ALERTS</span><h2>Signals worth seeing</h2></div><button className="ghost-btn" onClick={enable}>Enable notifications</button></div><div className="alerts-list">{alerts.map((a) => <div className={`alert-item ${a.type}`} key={a.title}><span className="alert-dot" /><div><strong>{a.title}</strong><p>{a.text}</p></div></div>)}</div></section>;
}

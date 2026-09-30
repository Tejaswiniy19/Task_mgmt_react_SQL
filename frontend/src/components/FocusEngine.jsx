import React from "react";
export default function FocusEngine({ intelligence, onStart }) {
  const task = intelligence?.recommendedTask;
  if (!task) {
    return <section className="focus-engine empty-focus"><div className="focus-orbit"><span>✓</span></div><div><span className="eyebrow">FOCUS ENGINE</span><h2>You're clear.</h2><p>No pending missions. Add one and the engine will calculate your next move.</p></div></section>;
  }
  const score = task.focusScore || 0;
  const circumference = 2 * Math.PI * 48;
  const offset = circumference - (score / 100) * circumference;
  return (
    <section className="focus-engine">
      <div className="engine-glow" />
      <div className="engine-copy">
        <span className="eyebrow">⚡ WORKER FOCUS ENGINE</span>
        <h2>Your next best mission</h2>
        <h3>{task.title}</h3>
        <div className="why-list">{(task.why || []).map((reason) => <span key={reason}>✓ {reason}</span>)}</div>
        <div className="engine-meta"><span>{task.priority} priority</span><span>{task.estimated_minutes} min</span><span>{intelligence.workloadLevel} workload</span></div>
        <button className="primary-btn" onClick={() => onStart(task)}>Start Focus Session <span>→</span></button>
      </div>
      <div className="score-wrap">
        <svg viewBox="0 0 120 120" className="score-ring">
          <circle className="ring-track" cx="60" cy="60" r="48" />
          <circle className="ring-progress" cx="60" cy="60" r="48" style={{ strokeDasharray: circumference, strokeDashoffset: offset }} />
        </svg>
        <div className="score-number"><strong>{score}</strong><span>FOCUS</span></div>
      </div>
    </section>
  );
}

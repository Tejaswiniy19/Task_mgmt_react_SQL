import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../services";
import { useAuth } from "../AuthContext";
import React from "react";

export default function FocusTimer({ task, onClose, onComplete }) {
  const { token, refreshUser } = useAuth();
  const initialSeconds = Math.max(60, (Number(task?.estimated_minutes) || 25) * 60);
  const [remaining, setRemaining] = useState(initialSeconds);
  const [running, setRunning] = useState(true);
  const [startedAt] = useState(Date.now());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setRemaining((v) => Math.max(0, v - 1)), 1000);
    return () => clearInterval(id);
  }, [running]);

  useEffect(() => {
    if (remaining === 0) finish();
  }, [remaining]);

  const elapsed = Math.max(0, Math.round((Date.now() - startedAt) / 1000));
  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");
  const progress = 1 - remaining / initialSeconds;
  const ringStyle = useMemo(() => ({ background: `conic-gradient(#9b7cff ${progress * 360}deg, rgba(255,255,255,.08) 0deg)` }), [progress]);

  async function finish() {
    if (saving) return;
    setSaving(true);
    try {
      const duration = Math.max(60, Math.min(initialSeconds, elapsed || 60));
      await apiRequest("/focus-sessions", { method: "POST", body: JSON.stringify({ taskId: task.id, durationSeconds: duration }) }, token);
      await refreshUser();
      onComplete?.();
      onClose();
    } catch (error) {
      alert(error.message);
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop">
      <div className="focus-modal">
        <button className="modal-close" onClick={onClose}>×</button>
        <span className="eyebrow">MISSION ACTIVE</span>
        <h2>{task.title}</h2>
        <p>Stay in the zone. TaskForge is timing your focus.</p>
        <div className="timer-orb" style={ringStyle}><div><strong>{mm}:{ss}</strong><span>FOCUS TIME</span></div></div>
        <div className="timer-actions">
          <button className="ghost-btn large" onClick={() => setRunning((v) => !v)}>{running ? "Pause" : "Resume"}</button>
          <button className="primary-btn" onClick={finish} disabled={saving}>{saving ? "Saving..." : "Finish Mission"}</button>
        </div>
      </div>
    </div>
  );
}

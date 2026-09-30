import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiRequest } from "../services";
import React from "react";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(e) {
    e.preventDefault(); setError("");
    if (form.password !== form.confirm) return setError("Passwords do not match.");
    setLoading(true);
    try { await apiRequest("/auth/register", { method: "POST", body: JSON.stringify({ name: form.name, email: form.email, password: form.password }) }); navigate("/login"); }
    catch (err) { setError(err.message); } finally { setLoading(false); }
  }
  return <div className="auth-page"><div className="auth-visual"><div className="auth-grid"/><div className="auth-copy"><span className="brand-mark large">◆</span><span>TaskForge</span><p>Build momentum one intelligent mission at a time.</p><div className="mini-metrics"><span><b>01</b> Focus Engine</span><span><b>02</b> Focus Sessions</span><span><b>03</b> Productivity Analytics</span></div></div></div><div className="auth-card"><div className="auth-brand"><span className="brand-mark">◆</span>TaskForge</div><span className="eyebrow">CREATE YOUR WORKSPACE</span><h1>Make your workload clearer.</h1><p className="auth-subtitle">Create an account and let the Focus Engine organize your next move.</p>{error && <div className="error-message">{error}</div>}<form onSubmit={submit}><label className="form-group">Name<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your name" required /></label><label className="form-group">Email<input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" required /></label><label className="form-group">Password<input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="At least 6 characters" minLength="6" required /></label><label className="form-group">Confirm password<input type="password" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} placeholder="Repeat password" required /></label><button className="primary-btn wide" disabled={loading}>{loading ? "Creating..." : "Create Workspace →"}</button></form><p className="auth-footer">Already have an account? <Link to="/login">Sign in</Link></p></div></div>;
}

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { apiRequest } from "../services";
import React from "react";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(e) {
    e.preventDefault(); setError(""); setLoading(true);
    try { const data = await apiRequest("/auth/login", { method: "POST", body: JSON.stringify(form) }); login(data.token, data.user); navigate("/dashboard"); }
    catch (err) { setError(err.message); } finally { setLoading(false); }
  }
  return <div className="auth-page"><div className="auth-visual"><div className="auth-orb orb-one"/><div className="auth-orb orb-two"/><div className="auth-copy"><span className="brand-mark large">◆</span><span>TaskForge</span><p>Turn a crowded task list into a clear next move.</p></div></div><div className="auth-card"><div className="auth-brand"><span className="brand-mark">◆</span>TaskForge</div><span className="eyebrow">WELCOME BACK</span><h1>Enter your focus zone.</h1><p className="auth-subtitle">Your intelligent workspace is ready.</p>{error && <div className="error-message">{error}</div>}<form onSubmit={submit}><label className="form-group">Email<input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" required /></label><label className="form-group">Password<input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Your password" required /></label><button className="primary-btn wide" disabled={loading}>{loading ? "Entering..." : "Enter TaskForge →"}</button></form><p className="auth-footer">New here? <Link to="/register">Create an account</Link></p></div></div>;
}

import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { useAuth } from "../AuthContext";
import { apiRequest } from "../services";
import React from "react";

export default function Profile() {
  const { token, user, refreshUser } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  useEffect(() => { apiRequest("/analytics", {}, token).then(setAnalytics).catch(() => {}); }, [token]);
  const level = analytics?.level || Math.floor((user?.xp || 0) / 250) + 1;
  const progress = ((analytics?.xp || user?.xp || 0) % 250) / 2.5;
  return <div className="app-shell"><Navbar/><main className="profile-page"><div className="page-heading"><span className="eyebrow">ACCOUNT / IDENTITY</span><h1>Your command center.</h1><p>Your profile is where your progress, consistency and focus history meet.</p></div><section className="profile-hero"><div className="profile-avatar">{(user?.name || "U")[0].toUpperCase()}</div><div><span className="eyebrow">LEVEL {level}</span><h2>{user?.name}</h2><p>{user?.email}</p><div className="xp-bar"><span style={{ width: `${progress}%` }}/></div><small>{analytics?.xp || user?.xp || 0} XP · {250 - ((analytics?.xp || user?.xp || 0) % 250)} XP to next level</small></div></section><div className="profile-grid"><div className="profile-stat"><span>Current streak</span><strong>{analytics?.streak || user?.current_streak || 0} days</strong></div><div className="profile-stat"><span>Focus time</span><strong>{analytics?.focusMinutes || 0} min</strong></div><div className="profile-stat"><span>Missions completed</span><strong>{analytics?.completed || 0}</strong></div><div className="profile-stat"><span>Completion rate</span><strong>{analytics?.completionRate || 0}%</strong></div></div><button className="ghost-btn" onClick={refreshUser}>Refresh profile data</button></main></div>;
}

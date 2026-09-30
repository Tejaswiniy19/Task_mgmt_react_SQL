import React, { useEffect, useMemo, useState } from "react";

import Navbar from "../components/Navbar";
import Stats from "../components/Stats";
import TaskCard from "../components/TaskCard";
import FocusEngine from "../components/FocusEngine";
import FocusTimer from "../components/FocusTimer";
import SmartAlerts from "../components/SmartAlerts";
import Timeline from "../components/Timeline";

import { useAuth } from "../AuthContext";
import { apiRequest } from "../services";

export default function Dashboard() {
  const { token, user, refreshUser } = useAuth();

  const [tasks, setTasks] = useState([]);
  const [intelligence, setIntelligence] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [focusTask, setFocusTask] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [filters, setFilters] = useState({
    search: "",
    status: "All",
    priority: "All",
    category: "All"
  });

  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "Medium",
    category: "Development",
    estimated_minutes: 30,
    deadline: ""
  });

  /*
   * ============================================================
   * LOAD DASHBOARD DATA
   * ============================================================
   */

  async function loadAll() {
    if (!token) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const query = new URLSearchParams(
        Object.entries(filters).filter(
          ([, value]) => value && value !== "All"
        )
      ).toString();

      const [taskData, intelligenceData, analyticsData] =
        await Promise.all([
          apiRequest(
            `/tasks${query ? `?${query}` : ""}`,
            {},
            token
          ),

          apiRequest(
            "/task-intelligence",
            {},
            token
          ),

          apiRequest(
            "/analytics",
            {},
            token
          )
        ]);

      setTasks(taskData);
      setIntelligence(intelligenceData);
      setAnalytics(analyticsData);

    } catch (error) {
      console.error("❌ Failed to load dashboard:", error);

      setError(
        error.message || "Unable to load dashboard data."
      );

    } finally {
      setLoading(false);
    }
  }

  /*
   * ============================================================
   * LOAD DATA WHEN USER / FILTERS CHANGE
   * ============================================================
   */

  useEffect(() => {
    loadAll();
  }, [
    token,
    filters.search,
    filters.status,
    filters.priority,
    filters.category
  ]);

  /*
   * ============================================================
   * BUILD CATEGORY LIST
   * ============================================================
   */

  const categories = useMemo(() => {
    return [
      "All",
      ...new Set(
        tasks
          .map((task) => task.category)
          .filter(Boolean)
      )
    ];
  }, [tasks]);

  /*
   * ============================================================
   * CREATE MISSION
   * ============================================================
   */

  async function createTask(event) {
    event.preventDefault();

    console.log("🚀 CREATE MISSION CLICKED");

    console.log("📝 Form data:", form);

    console.log(
      "🔐 Token exists:",
      Boolean(token)
    );

    /*
     * Validate title
     */

    const title = form.title.trim();

    if (!title) {
      setError("Please enter a mission title.");

      console.warn(
        "⚠️ Mission creation stopped: title is empty."
      );

      return;
    }

    /*
     * Make sure estimated time is a number
     */

    const estimatedMinutes =
      Number(form.estimated_minutes) || 30;

    /*
     * Build clean payload
     */

    const payload = {
      title: title,

      description:
        form.description.trim(),

      priority:
        form.priority,

      category:
        form.category,

      estimated_minutes:
        estimatedMinutes,

      deadline:
        form.deadline || null
    };

    console.log(
      "📤 Sending mission payload:",
      payload
    );

    try {
      setError("");

      /*
       * Send mission to backend
       */

      const result = await apiRequest(
        "/tasks",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify(payload)
        },
        token
      );

      console.log(
        "✅ Mission created successfully:",
        result
      );

      /*
       * Reset form
       */

      setForm({
        title: "",
        description: "",
        priority: "Medium",
        category: "Development",
        estimated_minutes: 30,
        deadline: ""
      });

      /*
       * Refresh dashboard
       */

      await loadAll();

    } catch (error) {
      console.error(
        "❌ CREATE MISSION FAILED:",
        error
      );

      setError(
        error.message ||
        "Could not create mission."
      );
    }
  }

  /*
   * ============================================================
   * COMPLETE MISSION
   * ============================================================
   */

  async function completeTask(id) {
    try {
      setError("");

      await apiRequest(
        `/tasks/${id}/complete`,
        {
          method: "PATCH"
        },
        token
      );

      await refreshUser();

      await loadAll();

    } catch (error) {
      console.error(
        "❌ COMPLETE MISSION FAILED:",
        error
      );

      setError(
        error.message ||
        "Could not complete mission."
      );
    }
  }

  /*
   * ============================================================
   * DELETE MISSION
   * ============================================================
   */

  async function deleteTask(id) {
    const confirmed = window.confirm(
      "Delete this mission?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      await apiRequest(
        `/tasks/${id}`,
        {
          method: "DELETE"
        },
        token
      );

      await loadAll();

    } catch (error) {
      console.error(
        "❌ DELETE MISSION FAILED:",
        error
      );

      setError(
        error.message ||
        "Could not delete mission."
      );
    }
  }

  /*
   * ============================================================
   * RENDER
   * ============================================================
   */

  return (
    <div className="app-shell">

      <Navbar />

      <main className="dashboard">

        {/* =====================================================
            HEADER
        ====================================================== */}

        <header className="dashboard-header">

          <div>

            <span className="eyebrow">
              PERSONAL WORKSPACE / LIVE
            </span>

            <h1>
              Welcome back,
              <br />

              <span>
                {user?.name || "Creator"}
              </span>
            </h1>

            <p>
              Turn a crowded task list into a clear
              next move. The Focus Engine is watching
              your workload.
            </p>

          </div>

          <div className="live-pill">
            <i />
            ENGINE ONLINE
          </div>

        </header>


        {/* =====================================================
            ERROR MESSAGE
        ====================================================== */}

        {error && (
          <div className="error-message dashboard-error">
            {error}
          </div>
        )}


        {/* =====================================================
            STATS
        ====================================================== */}

        <Stats
          intelligence={intelligence}
          analytics={analytics}
        />


        {/* =====================================================
            SMART ALERTS
        ====================================================== */}

        <SmartAlerts
          tasks={tasks}
        />


        {/* =====================================================
            FOCUS ENGINE
        ====================================================== */}

        <FocusEngine
          intelligence={intelligence}
          onStart={setFocusTask}
        />


        {/* =====================================================
            CREATE MISSION
        ====================================================== */}

        <section className="create-task-section">

          <div className="section-heading">

            <div>

              <span className="eyebrow">
                CREATE MISSION
              </span>

              <h2>
                Add something worth finishing.
              </h2>

            </div>

          </div>


          <form
            className="mission-form"
            onSubmit={createTask}
          >

            {/* Mission title */}

            <input
              className="mission-title"
              type="text"
              placeholder="What needs to be done?"
              value={form.title}
              onChange={(event) =>
                setForm({
                  ...form,
                  title: event.target.value
                })
              }
            />


            {/* Description */}

            <input
              type="text"
              placeholder="Optional description"
              value={form.description}
              onChange={(event) =>
                setForm({
                  ...form,
                  description: event.target.value
                })
              }
            />


            {/* Priority */}

            <select
              value={form.priority}
              onChange={(event) =>
                setForm({
                  ...form,
                  priority: event.target.value
                })
              }
            >

              <option value="High">
                High
              </option>

              <option value="Medium">
                Medium
              </option>

              <option value="Low">
                Low
              </option>

            </select>


            {/* Category */}

            <select
              value={form.category}
              onChange={(event) =>
                setForm({
                  ...form,
                  category: event.target.value
                })
              }
            >

              <option value="Development">
                Development
              </option>

              <option value="Study">
                Study
              </option>

              <option value="Project">
                Project
              </option>

              <option value="College">
                College
              </option>

              <option value="Interview">
                Interview
              </option>

              <option value="Personal">
                Personal
              </option>

            </select>


            {/* Estimated time */}

            <input
              type="number"
              min="5"
              max="600"
              value={form.estimated_minutes}
              onChange={(event) =>
                setForm({
                  ...form,
                  estimated_minutes:
                    event.target.value
                })
              }
            />


            {/* Deadline */}

            <input
              type="datetime-local"
              value={form.deadline}
              onChange={(event) =>
                setForm({
                  ...form,
                  deadline:
                    event.target.value
                })
              }
            />


            {/* Create button */}

            <button
              className="primary-btn"
              type="submit"
              onClick={() =>
                console.log(
                  "🟣 Create Mission button clicked"
                )
              }
            >
              Create Mission
              <span>+</span>
            </button>

          </form>

        </section>


        {/* =====================================================
            MISSION QUEUE
        ====================================================== */}

        <section className="tasks-section">

          <div className="section-heading">

            <div>

              <span className="eyebrow">
                YOUR WORK
              </span>

              <h2>
                Mission Queue
              </h2>

            </div>

            <span className="task-count">
              {tasks.length} missions
            </span>

          </div>


          {/* Filters */}

          <div className="filter-bar">

            <div className="search-box">

              <span>
                ⌕
              </span>

              <input
                type="text"
                placeholder="Search missions..."
                value={filters.search}
                onChange={(event) =>
                  setFilters({
                    ...filters,
                    search: event.target.value
                  })
                }
              />

            </div>


            {/* Status */}

            <select
              value={filters.status}
              onChange={(event) =>
                setFilters({
                  ...filters,
                  status: event.target.value
                })
              }
            >

              <option value="All">
                All
              </option>

              <option value="Pending">
                Pending
              </option>

              <option value="Completed">
                Completed
              </option>

            </select>


            {/* Priority */}

            <select
              value={filters.priority}
              onChange={(event) =>
                setFilters({
                  ...filters,
                  priority: event.target.value
                })
              }
            >

              <option value="All">
                All
              </option>

              <option value="High">
                High
              </option>

              <option value="Medium">
                Medium
              </option>

              <option value="Low">
                Low
              </option>

            </select>


            {/* Category */}

            <select
              value={filters.category}
              onChange={(event) =>
                setFilters({
                  ...filters,
                  category: event.target.value
                })
              }
            >

              {categories.map(
                (category) => (
                  <option
                    key={category}
                    value={category}
                  >
                    {category}
                  </option>
                )
              )}

            </select>

          </div>


          {/* Mission content */}

          {loading ? (

            <div className="loading-inline">

              <div className="loader small" />

              Syncing workspace...

            </div>

          ) : tasks.length ? (

            <div className="task-list">

              {tasks.map((task) => (

                <TaskCard
                  key={task.id}
                  task={task}
                  onComplete={completeTask}
                  onDelete={deleteTask}
                  onFocus={setFocusTask}
                />

              ))}

            </div>

          ) : (

            <div className="empty-state">

              <div className="empty-icon">
                +
              </div>

              <h3>
                No missions match this view.
              </h3>

              <p>
                Create a mission or change your
                filters.
              </p>

            </div>

          )}

        </section>


        {/* =====================================================
            TIMELINE
        ====================================================== */}

        <Timeline
          tasks={tasks}
        />


        {/* =====================================================
            FOOTER
        ====================================================== */}

        <footer>

          <span>
            TASKFORGE ENGINE
          </span>

          <span>
            React · Express · MySQL · Worker Thread · Focus Engine
          </span>

        </footer>

      </main>


      {/* =======================================================
          FOCUS TIMER
      ======================================================== */}

      {focusTask && (

        <FocusTimer
          task={focusTask}
          onClose={() =>
            setFocusTask(null)
          }
          onComplete={loadAll}
        />

      )}

    </div>
  );
}
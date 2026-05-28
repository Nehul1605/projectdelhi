import { useState } from "react";
import { Link } from "react-router-dom";
import {
  getTasks,
  getVerifiedTasks,
  updateTaskStatus,
  getVolunteerApps,
  updateVolunteerAppStatus,
} from "../store";
import {
  CATEGORY_META,
  TaskRequest,
  VolunteerApp,
  ApplicationStatus,
} from "../types";

interface Props {
  addToast: (msg: string, type?: "success" | "error" | "info") => void;
}

export default function Admin({ addToast }: Props) {
  const [tab, setTab] = useState<"verified" | "all" | "volunteers">("verified");
  const [appStatusFilter, setAppStatusFilter] = useState<
    ApplicationStatus | "all"
  >("all");
  const [, setRefresh] = useState(0);

  const refresh = () => setRefresh((n) => n + 1);

  const verifiedProposals = getVerifiedTasks();
  const allTasks = getTasks();
  const volunteerApps = getVolunteerApps();

  const handlePublish = (id: string) => {
    updateTaskStatus(id, "approved");
    addToast("Task approved and now Live! ✅", "success");
    refresh();
  };

  const handleReject = (id: string) => {
    updateTaskStatus(id, "rejected");
    addToast("Task rejected ❌", "info");
    refresh();
  };

  const handleApproveApp = (id: string) => {
    updateVolunteerAppStatus(id, "approved");
    addToast("Volunteer application approved ✅", "success");
    refresh();
  };

  const handleRejectApp = (id: string) => {
    updateVolunteerAppStatus(id, "rejected");
    addToast("Volunteer application rejected ❌", "info");
    refresh();
  };

  const statusLabel = (status: ApplicationStatus) => {
    if (status === "applied") return "Received";
    if (status === "interviewing") return "Sent to Admin";
    if (status === "approved") return "Accepted";
    return "Rejected";
  };

  const exportApplications = (list: VolunteerApp[], filename: string) => {
    const headers = ["Name", "Email", "Phone", "Status", "Submitted At"];
    const rows = list.map((app) => [
      app.name,
      app.email,
      app.phone,
      statusLabel(app.status),
      new Date(app.createdAt).toLocaleString("en-IN"),
    ]);
    const csv = [headers, ...rows]
      .map((row) =>
        row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(","),
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const filteredApps =
    appStatusFilter === "all"
      ? volunteerApps
      : volunteerApps.filter((app) => app.status === appStatusFilter);

  const appCounts = volunteerApps.reduce(
    (acc, app) => {
      acc[app.status] = (acc[app.status] || 0) + 1;
      return acc;
    },
    {
      applied: 0,
      interviewing: 0,
      approved: 0,
      rejected: 0,
    } as Record<ApplicationStatus, number>,
  );

  const displayTasks = tab === "verified" ? verifiedProposals : allTasks;

  return (
    <div className="container page-section page-enter">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 32,
        }}
      >
        <div>
          <h2 style={{ fontWeight: 800 }}>Admin Dashboard</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
            Manage final task publishing and verification
          </p>
        </div>
      </div>

      {/* Stats Summary */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 12,
          marginBottom: 32,
        }}
      >
        <div
          className="card card-flat"
          style={{ padding: 20, textAlign: "center" }}
        >
          <div
            style={{
              fontSize: "1.8rem",
              fontWeight: 800,
              color: "var(--warning)",
            }}
          >
            {verifiedProposals.length}
          </div>
          <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
            Ready for Live
          </div>
        </div>
        <div
          className="card card-flat"
          style={{ padding: 20, textAlign: "center" }}
        >
          <div
            style={{
              fontSize: "1.8rem",
              fontWeight: 800,
              color: "var(--success)",
            }}
          >
            {allTasks.filter((t) => t.status === "approved").length}
          </div>
          <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
            Live Proposals
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        <button
          className={`filter-chip ${tab === "verified" ? "active" : ""}`}
          onClick={() => setTab("verified")}
        >
          ✅ Verified Proposals ({verifiedProposals.length})
        </button>
        <button
          className={`filter-chip ${tab === "all" ? "active" : ""}`}
          onClick={() => setTab("all")}
        >
          🌐 All Tasks
        </button>
        <button
          className={`filter-chip ${tab === "volunteers" ? "active" : ""}`}
          onClick={() => setTab("volunteers")}
        >
          👥 Volunteer Applications ({volunteerApps.length})
        </button>
      </div>

      {/* Task List */}
      {tab !== "volunteers" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {displayTasks.length === 0 ? (
            <div className="empty-state">
              <div className="emoji">✨</div>
              <h3>No {tab} tasks</h3>
              <p>All caught up! No tasks to review right now.</p>
            </div>
          ) : (
            displayTasks.map((task: TaskRequest) => {
              const cat = CATEGORY_META[task.category];
              return (
                <div key={task.id} className="card admin-card">
                  <div className="admin-task-header">
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          display: "flex",
                          gap: 8,
                          alignItems: "center",
                          marginBottom: 8,
                          flexWrap: "wrap",
                        }}
                      >
                        <span
                          className="tag"
                          style={{
                            background: cat.color + "15",
                            color: cat.color,
                          }}
                        >
                          {cat.emoji} {cat.label}
                        </span>
                        <span className={`status-badge status-${task.status}`}>
                          {task.status.toUpperCase()}
                        </span>
                        <span
                          className="tag"
                          style={{ background: "#F3F4F6", color: "#6B7280" }}
                        >
                          {task.applicantType === "group"
                            ? "👥 Organization"
                            : "🙋 Individual"}
                        </span>
                      </div>
                      <h3>
                        <Link
                          to={`/task/${task.id}`}
                          style={{
                            color: "var(--text)",
                            textDecoration: "none",
                          }}
                        >
                          {task.title}
                        </Link>
                      </h3>
                      <p
                        style={{
                          fontSize: "0.9rem",
                          color: "var(--text-secondary)",
                          marginTop: 6,
                          lineHeight: 1.6,
                        }}
                      >
                        {task.description.substring(0, 200)}
                        {task.description.length > 200 ? "..." : ""}
                      </p>
                      <div
                        style={{
                          display: "flex",
                          gap: 16,
                          marginTop: 10,
                          fontSize: "0.85rem",
                          color: "var(--text-muted)",
                          flexWrap: "wrap",
                        }}
                      >
                        <span>
                          👤 {task.applicantName}
                          {task.organizationName
                            ? ` — ${task.organizationName}`
                            : ""}
                        </span>
                        <span>
                          📍 {task.locality}, {task.city}
                        </span>
                        <span>
                          📅{" "}
                          {new Date(task.eventDate).toLocaleDateString(
                            "en-IN",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            },
                          )}
                        </span>
                        <span>
                          👥 {task.volunteers.length}/{task.volunteersNeeded}{" "}
                          volunteers
                        </span>
                      </div>
                    </div>
                    {task.status === "verified" && (
                      <div className="admin-actions" style={{ flexShrink: 0 }}>
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => handlePublish(task.id)}
                        >
                          🚀 Publish (Live)
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleReject(task.id)}
                        >
                          ✕ Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {tab === "volunteers" && (
        <div>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <button
              className={`filter-chip ${appStatusFilter === "all" ? "active" : ""}`}
              onClick={() => setAppStatusFilter("all")}
            >
              All ({volunteerApps.length})
            </button>
            <button
              className={`filter-chip ${appStatusFilter === "applied" ? "active" : ""}`}
              onClick={() => setAppStatusFilter("applied")}
            >
              Received ({appCounts.applied})
            </button>
            <button
              className={`filter-chip ${appStatusFilter === "interviewing" ? "active" : ""}`}
              onClick={() => setAppStatusFilter("interviewing")}
            >
              Sent to Admin ({appCounts.interviewing})
            </button>
            <button
              className={`filter-chip ${appStatusFilter === "approved" ? "active" : ""}`}
              onClick={() => setAppStatusFilter("approved")}
            >
              Accepted ({appCounts.approved})
            </button>
            <button
              className={`filter-chip ${appStatusFilter === "rejected" ? "active" : ""}`}
              onClick={() => setAppStatusFilter("rejected")}
            >
              Rejected ({appCounts.rejected})
            </button>
            <button
              className="btn btn-outline btn-sm"
              onClick={() =>
                exportApplications(
                  filteredApps,
                  "admin-volunteer-applications.csv",
                )
              }
              style={{ marginLeft: "auto" }}
            >
              Export CSV
            </button>
          </div>

          {filteredApps.length === 0 ? (
            <div className="empty-state">
              <div className="emoji">📝</div>
              <h3>No applications</h3>
              <p>No volunteer applications in this view.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {filteredApps.map((app) => (
                <div key={app.id} className="card" style={{ padding: 16 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 16,
                      flexWrap: "wrap",
                    }}
                  >
                    <div>
                      <h3 style={{ marginBottom: 6 }}>{app.name}</h3>
                      <p style={{ margin: 0, color: "var(--text-secondary)" }}>
                        {app.email} · {app.phone}
                      </p>
                      <p
                        style={{
                          marginTop: 8,
                          fontSize: "0.9rem",
                          color: "var(--text-secondary)",
                        }}
                      >
                        {app.reason}
                      </p>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-end",
                        gap: 10,
                      }}
                    >
                      <span className={`status-badge status-${app.status}`}>
                        {statusLabel(app.status)}
                      </span>
                      {app.status === "interviewing" && (
                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => handleApproveApp(app.id)}
                          >
                            Accept
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleRejectApp(app.id)}
                          >
                            Reject
                          </button>
                        </div>
                      )}
                      {app.status === "applied" && (
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleRejectApp(app.id)}
                        >
                          Reject
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

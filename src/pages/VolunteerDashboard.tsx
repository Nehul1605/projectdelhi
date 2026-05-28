import { useState, useEffect } from "react";
import {
  getPendingTasks,
  updateTaskStatus,
  getVolunteerApps,
  updateVolunteerAppStatus,
} from "../store";
import { TaskRequest, VolunteerApp, ApplicationStatus } from "../types";

interface VolunteerDashboardProps {
  addToast: (msg: string, type: "success" | "error" | "info") => void;
}

export default function VolunteerDashboard({
  addToast,
}: VolunteerDashboardProps) {
  const [activeTab, setActiveTab] = useState<"proposals" | "applications">(
    "proposals",
  );
  const [proposals, setProposals] = useState<TaskRequest[]>([]);
  const [applications, setApplications] = useState<VolunteerApp[]>([]);
  const [appStatusFilter, setAppStatusFilter] = useState<
    ApplicationStatus | "all"
  >("all");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setProposals(getPendingTasks());
    setApplications(getVolunteerApps());
  };

  const handleVerifyProposal = (id: string) => {
    updateTaskStatus(id, "verified");
    addToast("Proposal marked as verified. Sent to Admin queue.", "success");
    loadData();
  };

  const handleRejectProposal = (id: string) => {
    updateTaskStatus(id, "rejected");
    addToast("Proposal rejected.", "info");
    loadData();
  };

  const handleApproveApp = (id: string) => {
    updateVolunteerAppStatus(id, "interviewing");
    addToast("Application sent to Admin for final review.", "info");
    loadData();
  };

  const handleRejectApp = (id: string) => {
    updateVolunteerAppStatus(id, "rejected");
    addToast("Application rejected.", "error");
    loadData();
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
      ? applications
      : applications.filter((app) => app.status === appStatusFilter);

  const appCounts = applications.reduce(
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

  return (
    <div className="page-container page-enter">
      <div className="container" style={{ padding: "40px 20px" }}>
        <h1 className="page-title">
          Moderator <span style={{ color: "var(--primary)" }}>Dashboard</span>
        </h1>

        <div style={{ display: "flex", gap: "10px", marginBottom: "24px" }}>
          <button
            className={`filter-chip ${activeTab === "proposals" ? "active" : ""}`}
            onClick={() => setActiveTab("proposals")}
          >
            Proposals ({proposals.length})
          </button>
          <button
            className={`filter-chip ${activeTab === "applications" ? "active" : ""}`}
            onClick={() => setActiveTab("applications")}
          >
            Volunteer Applications ({applications.length})
          </button>
        </div>

        {activeTab === "proposals" && (
          <div className="grid">
            {proposals.length === 0 ? (
              <p style={{ color: "var(--text-secondary)" }}>
                No pending proposals to review.
              </p>
            ) : (
              proposals.map((proposal) => (
                <div key={proposal.id} className="card">
                  <h3 style={{ marginBottom: "10px" }}>{proposal.title}</h3>
                  <p
                    style={{
                      fontSize: "0.9rem",
                      color: "var(--text-secondary)",
                      marginBottom: "10px",
                    }}
                  >
                    By: {proposal.applicantName} ({proposal.email})
                  </p>
                  <p style={{ fontSize: "0.9rem", marginBottom: "20px" }}>
                    {proposal.description}
                  </p>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleVerifyProposal(proposal.id)}
                    >
                      Verify (Send to Admin)
                    </button>
                    <button
                      className="btn btn-outline btn-sm"
                      style={{
                        color: "var(--danger)",
                        borderColor: "var(--danger)",
                      }}
                      onClick={() => handleRejectProposal(proposal.id)}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "applications" && (
          <div>
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              <button
                className={`filter-chip ${appStatusFilter === "all" ? "active" : ""}`}
                onClick={() => setAppStatusFilter("all")}
              >
                All ({applications.length})
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
                    "moderator-volunteer-applications.csv",
                  )
                }
                style={{ marginLeft: "auto" }}
              >
                Export CSV
              </button>
            </div>

            {filteredApps.length === 0 ? (
              <p style={{ color: "var(--text-secondary)" }}>
                No applications in this view.
              </p>
            ) : (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
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
                        <p
                          style={{ margin: 0, color: "var(--text-secondary)" }}
                        >
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
                        {app.status === "applied" && (
                          <div style={{ display: "flex", gap: 8 }}>
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => handleApproveApp(app.id)}
                            >
                              Send to Admin
                            </button>
                            <button
                              className="btn btn-outline btn-sm"
                              style={{
                                color: "var(--danger)",
                                borderColor: "var(--danger)",
                              }}
                              onClick={() => handleRejectApp(app.id)}
                            >
                              Reject
                            </button>
                          </div>
                        )}
                        {app.status === "interviewing" && (
                          <button
                            className="btn btn-outline btn-sm"
                            style={{
                              color: "var(--danger)",
                              borderColor: "var(--danger)",
                            }}
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
    </div>
  );
}

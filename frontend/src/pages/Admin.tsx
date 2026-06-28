import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  getTasks,
  slugify,
  getVerifiedTasks,
  updateTaskStatus,
  getVolunteerApps,
  updateVolunteerAppStatus,
  getSubscribers,
  getGeneralVolunteers,
  GeneralVolunteer,
  getGeneralPartners,
  updatePartnerStatus,
  getDonationReports,
  updateDonationStatus,
  DonationReport,
  allowUserEditProposal,
  resolveUserQuery,
  deleteProposal,
  adminEditProposal,
  updateTaskFeatured,
} from "../store";
import {
  CATEGORY_META,
  TaskRequest,
  VolunteerApp,
  ApplicationStatus,
  GeneralPartner,
} from "../types";
import { X, Clock } from "lucide-react";

interface Props {
  addToast: (msg: string, type?: "success" | "error" | "info") => void;
}

export default function Admin({ addToast }: Props) {
  const [tab, setTab] = useState<"verified" | "all" | "volunteers" | "subscribers" | "registry" | "partners" | "donations" | "queries">("verified");
  const [appStatusFilter, setAppStatusFilter] = useState<
    ApplicationStatus | "all"
  >("all");
  const [, setRefresh] = useState(0);
  const [subscribers, setSubscribers] = useState<string[]>([]);
  const [generalVolunteers, setGeneralVolunteers] = useState<GeneralVolunteer[]>([]);
  const [generalPartners, setGeneralPartners] = useState<GeneralPartner[]>([]);
  const [donations, setDonations] = useState<DonationReport[]>([]);

  // Delete prompt state
  const [isDeletePromptOpen, setIsDeletePromptOpen] = useState(false);
  const [proposalIdToDelete, setProposalIdToDelete] = useState<string | null>(null);
  const [deletionReason, setDeletionReason] = useState("");

  // Rejection modal states
  const [isAdminRejectModalOpen, setIsAdminRejectModalOpen] = useState(false);
  const [adminRejectProposalId, setAdminRejectProposalId] = useState<string | null>(null);
  const [adminProposalRejectionReason, setAdminProposalRejectionReason] = useState("");

  // Staff Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProposal, setEditingProposal] = useState<TaskRequest | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editShortDescription, setEditShortDescription] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editEventDate, setEditEventDate] = useState("");
  const [editEventTime, setEditEventTime] = useState("");
  const [editEventDuration, setEditEventDuration] = useState(1);
  const [editVolunteersNeeded, setEditVolunteersNeeded] = useState(5);
  const [editAddress, setEditAddress] = useState("");
  const [editLocality, setEditLocality] = useState("");
  const [editPincode, setEditPincode] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editOrgName, setEditOrgName] = useState("");
  const [editOrgType, setEditOrgType] = useState("");
  const [editDesignation, setEditDesignation] = useState("");

  const handleStartEditProposal = (proposal: TaskRequest) => {
    setEditingProposal(proposal);
    setEditTitle(proposal.title);
    setEditDescription(proposal.description);
    setEditShortDescription(proposal.shortDescription || "");
    setEditCategory(proposal.category);
    setEditEventDate(proposal.eventDate);
    setEditEventTime(proposal.eventTime || "");
    setEditEventDuration(proposal.eventDuration || 1);
    setEditVolunteersNeeded(proposal.volunteersNeeded);
    setEditAddress(proposal.address);
    setEditLocality(proposal.locality);
    setEditPincode(proposal.pincode);
    setEditCity(proposal.city);
    setEditOrgName(proposal.organizationName || "");
    setEditOrgType(proposal.organizationType || "");
    setEditDesignation(proposal.designation || "");
    setIsEditModalOpen(true);
  };

  const handleSaveEditProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProposal) return;

    try {
      await adminEditProposal(editingProposal.id, {
        title: editTitle,
        description: editDescription,
        shortDescription: editShortDescription,
        category: editCategory as any,
        eventDate: editEventDate,
        eventTime: editEventTime,
        eventDuration: editEventDuration,
        volunteersNeeded: editVolunteersNeeded,
        address: editAddress,
        locality: editLocality,
        pincode: editPincode,
        city: editCity,
        organizationName: editingProposal.applicantType === "group" ? editOrgName : undefined,
        organizationType: editingProposal.applicantType === "group" ? editOrgType : undefined,
        designation: editingProposal.applicantType === "group" ? editDesignation : undefined,
      });

      addToast("Proposal details updated successfully.", "success");
      setIsEditModalOpen(false);
      setEditingProposal(null);
      refresh();
    } catch (error) {
      addToast("Failed to update proposal details.", "error");
    }
  };

  const refresh = () => setRefresh((n) => n + 1);

  useEffect(() => {
    getSubscribers().then(setSubscribers);
    getGeneralVolunteers().then(setGeneralVolunteers);
    getGeneralPartners().then(setGeneralPartners);
    getDonationReports().then(setDonations);
  }, [tab]);

  const verifiedProposals = getVerifiedTasks();
  const allTasks = getTasks();
  const volunteerApps = getVolunteerApps();
  const revisionRequests = allTasks.filter((t) => t.userQueryStatus === "pending");

  const handleAllowEdit = async (taskId: string) => {
    try {
      await allowUserEditProposal(taskId);
      addToast("Granted edit permission to user.", "success");
      refresh();
    } catch (error) {
      addToast("Failed to allow user to edit.", "error");
    }
  };

  const handleResolveQuery = async (taskId: string) => {
    try {
      await resolveUserQuery(taskId);
      addToast("Request marked as resolved.", "info");
      refresh();
    } catch (error) {
      addToast("Failed to resolve request.", "error");
    }
  };

  const handleDeleteProposal = (taskId: string) => {
    setProposalIdToDelete(taskId);
    setDeletionReason("Admin deleted initiative");
    setIsDeletePromptOpen(true);
  };

  const confirmDeleteProposal = async () => {
    if (!proposalIdToDelete) return;
    try {
      await deleteProposal(proposalIdToDelete, "Admin", deletionReason || "Deleted by admin");
      addToast("Proposal deleted and archived successfully.", "success");
      setIsDeletePromptOpen(false);
      setProposalIdToDelete(null);
      setDeletionReason("");
      refresh();
    } catch (error) {
      addToast("Failed to delete proposal.", "error");
    }
  };

  const handlePublish = (id: string) => {
    updateTaskStatus(id, "approved");
    addToast("Task approved and now Live!", "success");
    refresh();
  };

  const handleToggleFeatured = (id: string, isFeatured: boolean) => {
    updateTaskFeatured(id, isFeatured);
    addToast(isFeatured ? "Campaign marked as Featured!" : "Campaign removed from Featured.", "success");
    refresh();
  };

  const handleReject = (id: string) => {
    setAdminRejectProposalId(id);
    setAdminProposalRejectionReason("");
    setIsAdminRejectModalOpen(true);
  };

  const confirmAdminRejectProposal = () => {
    if (!adminRejectProposalId || !adminProposalRejectionReason.trim()) {
      addToast("Please provide a rejection reason.", "info");
      return;
    }
    updateTaskStatus(adminRejectProposalId, "rejected", adminProposalRejectionReason.trim());
    addToast("Task rejected.", "info");
    setIsAdminRejectModalOpen(false);
    setAdminRejectProposalId(null);
    setAdminProposalRejectionReason("");
    refresh();
  };

  const handleApproveApp = (id: string) => {
    updateVolunteerAppStatus(id, "approved");
    addToast("Volunteer application approved", "success");
    refresh();
  };

  const handleRejectApp = (id: string) => {
    updateVolunteerAppStatus(id, "rejected");
    addToast("Volunteer application rejected", "info");
    refresh();
  };

  const handleApproveDonation = async (id: string) => {
    const res = await updateDonationStatus(id, "approved");
    if (res.success) {
      addToast("Donation approved! Tax receipt email triggered.", "success");
      getDonationReports().then(setDonations);
    } else {
      addToast(res.message || "Failed to approve donation", "error");
    }
  };

  const handleRejectDonation = async (id: string) => {
    const res = await updateDonationStatus(id, "rejected");
    if (res.success) {
      addToast("Donation report rejected.", "info");
      getDonationReports().then(setDonations);
    } else {
      addToast(res.message || "Failed to reject donation", "error");
    }
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

  const modalOverlayStyle: React.CSSProperties = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(45, 32, 24, 0.5)",
    backdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: "20px"
  };

  const modalContentStyle: React.CSSProperties = {
    background: "var(--bg-card)",
    borderRadius: "var(--radius)",
    width: "100%",
    maxWidth: "600px",
    maxHeight: "90vh",
    overflowY: "auto",
    padding: "32px",
    boxShadow: "var(--shadow-lg)",
    border: "1px solid var(--border-light)"
  };

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
          Verified Proposals ({verifiedProposals.length})
        </button>
        <button
          className={`filter-chip ${tab === "queries" ? "active" : ""}`}
          onClick={() => setTab("queries")}
        >
          Revision Requests ({revisionRequests.length})
        </button>
        <button
          className={`filter-chip ${tab === "all" ? "active" : ""}`}
          onClick={() => setTab("all")}
        >
          All Tasks
        </button>
        <button
          className={`filter-chip ${tab === "volunteers" ? "active" : ""}`}
          onClick={() => setTab("volunteers")}
        >
          Volunteer Applications ({volunteerApps.length})
        </button>
        <button
          className={`filter-chip ${tab === "subscribers" ? "active" : ""}`}
          onClick={() => setTab("subscribers")}
        >
          Email Subscribers ({subscribers.length})
        </button>
        <button
          className={`filter-chip ${tab === "registry" ? "active" : ""}`}
          onClick={() => setTab("registry")}
        >
          General Registry ({generalVolunteers.length})
        </button>
        <button
          className={`filter-chip ${tab === "partners" ? "active" : ""}`}
          onClick={() => setTab("partners")}
        >
          Partner Pool ({generalPartners.length})
        </button>
        <button
          className={`filter-chip ${tab === "donations" ? "active" : ""}`}
          onClick={() => setTab("donations")}
        >
          Donation Reports ({donations.length})
        </button>
      </div>

      {/* Task List */}
      {(tab === "verified" || tab === "all") && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {displayTasks.length === 0 ? (
            <div className="empty-state">
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
                          style={{ background: "var(--bg-warm)", color: "var(--text-secondary)" }}
                        >
                          {task.applicantType === "group"
                            ? "Organization"
                            : "Individual"}
                        </span>
                      </div>
                      <h3>
                        <Link
                          to={`/initiatives/${slugify(task.title)}`}
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
                            ? ` — ${task.organizationName}${task.organizationType ? ` (${task.organizationType})` : ""}${task.designation ? ` (${task.designation})` : ""}`
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
                          {task.volunteers.length}/{task.volunteersNeeded}{" "}
                          volunteers
                        </span>
                      </div>

                      <div 
                        style={{ 
                          display: "grid", 
                          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
                          gap: "10px", 
                          background: "rgba(0,0,0,0.02)", 
                          padding: "12px", 
                          borderRadius: "10px", 
                          marginTop: "12px",
                          border: "1px solid var(--border-light)",
                          fontSize: "0.8rem"
                        }}
                      >
                        <div>
                          <strong style={{ color: "var(--text-secondary)" }}>Email:</strong> {task.email || "N/A"}
                        </div>
                        <div>
                          <strong style={{ color: "var(--text-secondary)" }}>Phone:</strong> {task.phone || "N/A"}
                        </div>
                        <div>
                          <strong style={{ color: "var(--text-secondary)" }}>Time:</strong> {task.eventTime || "Anytime"}
                        </div>
                        <div>
                          <strong style={{ color: "var(--text-secondary)" }}>Pincode:</strong> {task.pincode || "N/A"}
                        </div>
                        <div style={{ gridColumn: "1 / -1" }}>
                          <strong style={{ color: "var(--text-secondary)" }}>Full Map Address:</strong> {task.address || "N/A"}
                        </div>
                      </div>
                    </div>
                    {task.status === "verified" && (
                      <div className="admin-actions" style={{ flexShrink: 0, display: "flex", gap: "8px" }}>
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => handlePublish(task.id)}
                        >
                          Publish (Live)
                        </button>
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => handleStartEditProposal(task)}
                          style={{ color: "var(--primary)", borderColor: "var(--primary)" }}
                        >
                          ✏️ Edit Details
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleReject(task.id)}
                        >
                          ✕ Reject
                        </button>
                      </div>
                    )}
                    {task.status === "approved" && (
                      <div className="admin-actions" style={{ flexShrink: 0, display: "flex", gap: "8px" }}>
                        <button
                          className={`btn btn-sm ${task.isFeatured ? 'btn-primary' : 'btn-outline'}`}
                          onClick={() => handleToggleFeatured(task.id, !task.isFeatured)}
                          style={!task.isFeatured ? { color: "var(--primary)", borderColor: "var(--primary)" } : undefined}
                        >
                          {task.isFeatured ? "★ Featured" : "☆ Make Featured"}
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
                      <p style={{ margin: "4px 0", fontSize: "0.85rem", color: "var(--primary)", fontWeight: 600 }}>
                        For Task: {app.taskTitle || "Unknown Task"}
                      </p>
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
                        <strong>Reason:</strong> {app.reason}
                      </p>
                      {app.prevExperience && (
                        <p
                          style={{
                            marginTop: 8,
                            fontSize: "0.88rem",
                            color: "var(--text-secondary)",
                            background: "rgba(0,0,0,0.02)",
                            padding: "8px 12px",
                            borderRadius: "8px",
                            borderLeft: "3px solid var(--primary-light)",
                          }}
                        >
                          <strong>Previous Experience:</strong> {app.prevExperience}
                        </p>
                      )}
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

      {tab === "subscribers" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ margin: 0 }}>Newsletter Subscribers</h3>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => {
                const headers = ["Email"];
                const rows = subscribers.map((email) => [email]);
                const csv = [headers, ...rows]
                  .map((row) => row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(","))
                  .join("\n");
                const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = "newsletter-subscribers.csv";
                link.click();
                URL.revokeObjectURL(url);
              }}
            >
              Export CSV
            </button>
          </div>

          {subscribers.length === 0 ? (
            <div className="empty-state">
              <h3>No subscribers</h3>
              <p>No email subscribers found yet.</p>
            </div>
          ) : (
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ background: "rgba(0,0,0,0.02)", borderBottom: "1px solid var(--border-light)" }}>
                    <th style={{ padding: "12px 16px", fontSize: "0.85rem", fontWeight: 700, color: "var(--text-muted)" }}>
                      Email Address
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {subscribers.map((email, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid var(--border-light)" }}>
                      <td style={{ padding: "12px 16px", fontSize: "0.95rem" }}>{email}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === "registry" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ margin: 0 }}>General Volunteer Registry</h3>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => {
                const headers = ["Name", "Email", "Phone", "Preferred Role", "Location", "Registered At"];
                const rows = generalVolunteers.map((vol) => [
                  vol.name,
                  vol.email,
                  vol.phone,
                  vol.preferredRole,
                  vol.location,
                  new Date(vol.createdAt).toLocaleString("en-IN"),
                ]);
                const csv = [headers, ...rows]
                  .map((row) => row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(","))
                  .join("\n");
                const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = "general-volunteer-registry.csv";
                link.click();
                URL.revokeObjectURL(url);
              }}
            >
              Export CSV
            </button>
          </div>

          {generalVolunteers.length === 0 ? (
            <div className="empty-state">
              <h3>No volunteers registered</h3>
              <p>No general volunteers found in the registry yet.</p>
            </div>
          ) : (
            <div className="card" style={{ padding: 0, overflow: "hidden", overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", minWidth: "600px" }}>
                <thead>
                  <tr style={{ background: "rgba(0,0,0,0.02)", borderBottom: "1px solid var(--border-light)" }}>
                    <th style={{ padding: "12px 16px", fontSize: "0.85rem", fontWeight: 700, color: "var(--text-muted)" }}>Name</th>
                    <th style={{ padding: "12px 16px", fontSize: "0.85rem", fontWeight: 700, color: "var(--text-muted)" }}>Email</th>
                    <th style={{ padding: "12px 16px", fontSize: "0.85rem", fontWeight: 700, color: "var(--text-muted)" }}>Phone</th>
                    <th style={{ padding: "12px 16px", fontSize: "0.85rem", fontWeight: 700, color: "var(--text-muted)" }}>Preferred Role</th>
                    <th style={{ padding: "12px 16px", fontSize: "0.85rem", fontWeight: 700, color: "var(--text-muted)" }}>Location</th>
                    <th style={{ padding: "12px 16px", fontSize: "0.85rem", fontWeight: 700, color: "var(--text-muted)" }}>Registered At</th>
                  </tr>
                </thead>
                <tbody>
                  {generalVolunteers.map((vol, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid var(--border-light)" }}>
                      <td style={{ padding: "12px 16px", fontSize: "0.95rem", fontWeight: 600 }}>{vol.name}</td>
                      <td style={{ padding: "12px 16px", fontSize: "0.95rem" }}>{vol.email}</td>
                      <td style={{ padding: "12px 16px", fontSize: "0.95rem" }}>{vol.phone}</td>
                      <td style={{ padding: "12px 16px", fontSize: "0.95rem" }}>{vol.preferredRole}</td>
                      <td style={{ padding: "12px 16px", fontSize: "0.95rem" }}>{vol.location}</td>
                      <td style={{ padding: "12px 16px", fontSize: "0.95rem", color: "var(--text-muted)" }}>
                        {new Date(vol.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === "partners" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ margin: 0 }}>General Partner Directory</h3>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => {
                const headers = ["Organization Name", "Org Type", "Contact Name", "Designation", "Email", "Phone", "Locality", "Intent", "Registered At"];
                const rows = generalPartners.map((part) => [
                  part.orgName,
                  part.orgType,
                  part.contactName,
                  part.designation,
                  part.email,
                  part.phone,
                  part.location,
                  part.collabReason,
                  new Date(part.createdAt || "").toLocaleString("en-IN"),
                ]);
                const csv = [headers, ...rows]
                  .map((row) => row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(","))
                  .join("\n");
                const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = "general-partner-directory.csv";
                link.click();
                URL.revokeObjectURL(url);
              }}
            >
              Export CSV
            </button>
          </div>

          {generalPartners.length === 0 ? (
            <div className="empty-state">
              <h3>No partner organizations registered</h3>
              <p>No partner organizations found in the directory yet.</p>
            </div>
          ) : (
            <div className="card" style={{ padding: 0, overflow: "hidden", overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", minWidth: "1000px" }}>
                <thead>
                  <tr style={{ background: "rgba(0,0,0,0.02)", borderBottom: "1px solid var(--border-light)" }}>
                    <th style={{ padding: "12px 16px", fontSize: "0.85rem", fontWeight: 700, color: "var(--text-muted)" }}>Org Name</th>
                    <th style={{ padding: "12px 16px", fontSize: "0.85rem", fontWeight: 700, color: "var(--text-muted)" }}>Type</th>
                    <th style={{ padding: "12px 16px", fontSize: "0.85rem", fontWeight: 700, color: "var(--text-muted)" }}>Contact Name</th>
                    <th style={{ padding: "12px 16px", fontSize: "0.85rem", fontWeight: 700, color: "var(--text-muted)" }}>Designation</th>
                    <th style={{ padding: "12px 16px", fontSize: "0.85rem", fontWeight: 700, color: "var(--text-muted)" }}>Email</th>
                    <th style={{ padding: "12px 16px", fontSize: "0.85rem", fontWeight: 700, color: "var(--text-muted)" }}>Phone</th>
                    <th style={{ padding: "12px 16px", fontSize: "0.85rem", fontWeight: 700, color: "var(--text-muted)" }}>Location</th>
                    <th style={{ padding: "12px 16px", fontSize: "0.85rem", fontWeight: 700, color: "var(--text-muted)" }}>Collab Reason</th>
                    <th style={{ padding: "12px 16px", fontSize: "0.85rem", fontWeight: 700, color: "var(--text-muted)" }}>Registered At</th>
                    <th style={{ padding: "12px 16px", fontSize: "0.85rem", fontWeight: 700, color: "var(--text-muted)" }}>Status</th>
                    <th style={{ padding: "12px 16px", fontSize: "0.85rem", fontWeight: 700, color: "var(--text-muted)" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {generalPartners.map((part, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid var(--border-light)" }}>
                      <td style={{ padding: "12px 16px", fontSize: "0.95rem", fontWeight: 600 }}>{part.orgName}</td>
                      <td style={{ padding: "12px 16px", fontSize: "0.95rem" }}>
                        <span style={{
                          padding: "2px 8px",
                          borderRadius: "4px",
                          fontSize: "0.8rem",
                          fontWeight: 600,
                          background: "var(--border-light)",
                          color: "var(--text-secondary)"
                        }}>{part.orgType}</span>
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: "0.95rem" }}>{part.contactName}</td>
                      <td style={{ padding: "12px 16px", fontSize: "0.95rem" }}>{part.designation}</td>
                      <td style={{ padding: "12px 16px", fontSize: "0.95rem" }}>
                        <a href={`mailto:${part.email}`} style={{ color: "var(--primary)", textDecoration: "none" }}>{part.email}</a>
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: "0.95rem" }}>{part.phone}</td>
                      <td style={{ padding: "12px 16px", fontSize: "0.95rem" }}>{part.location}</td>
                      <td style={{ padding: "12px 16px", fontSize: "0.9rem", maxWidth: "200px", wordBreak: "break-word" }}>{part.collabReason}</td>
                      <td style={{ padding: "12px 16px", fontSize: "0.95rem", color: "var(--text-muted)" }}>
                        {new Date(part.createdAt || "").toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: "0.95rem" }}>
                        <span style={{
                          padding: "4px 8px",
                          borderRadius: "4px",
                          fontSize: "0.8rem",
                          fontWeight: 600,
                          background: part.status === "approved" ? "rgba(16, 185, 129, 0.1)" : part.status === "rejected" ? "rgba(239, 68, 68, 0.1)" : "rgba(245, 158, 11, 0.1)",
                          color: part.status === "approved" ? "var(--success)" : part.status === "rejected" ? "var(--danger)" : "var(--warning)"
                        }}>{part.status === "interviewing" ? "Interviewing" : part.status === "approved" ? "Approved" : part.status === "rejected" ? "Rejected" : "Applied"}</span>
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: "0.95rem" }}>
                        <div style={{ display: "flex", gap: "8px" }}>
                          {part.status === "applied" && (
                            <button
                              onClick={async () => {
                                const res = await updatePartnerStatus(part.id || "", "interviewing");
                                if (res.success) {
                                  addToast("Status updated to Interviewing", "success");
                                  getGeneralPartners().then(setGeneralPartners);
                                } else {
                                  addToast(res.message || "Failed to update", "error");
                                }
                              }}
                              className="btn btn-outline btn-xs"
                              style={{ padding: "4px 8px", fontSize: "0.75rem" }}
                            >
                              Interview
                            </button>
                          )}
                          {part.status !== "approved" && (
                            <button
                              onClick={async () => {
                                const res = await updatePartnerStatus(part.id || "", "approved");
                                if (res.success) {
                                  addToast("Partnership request approved!", "success");
                                  getGeneralPartners().then(setGeneralPartners);
                                } else {
                                  addToast(res.message || "Failed to update", "error");
                                }
                              }}
                              className="btn btn-primary btn-xs"
                              style={{ padding: "4px 8px", fontSize: "0.75rem", background: "var(--success)", borderColor: "var(--success)" }}
                            >
                              Approve
                            </button>
                          )}
                          {part.status !== "rejected" && (
                            <button
                              onClick={async () => {
                                const res = await updatePartnerStatus(part.id || "", "rejected");
                                if (res.success) {
                                  addToast("Partnership request rejected.", "info");
                                  getGeneralPartners().then(setGeneralPartners);
                                } else {
                                  addToast(res.message || "Failed to update", "error");
                                }
                              }}
                              className="btn btn-outline btn-xs"
                              style={{ padding: "4px 8px", fontSize: "0.75rem", color: "var(--danger)", borderColor: "var(--danger)" }}
                            >
                              Reject
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === "donations" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ margin: 0 }}>Donation Reports</h3>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => {
                const headers = ["Date", "Donor Name", "Email", "Phone", "Amount", "Method", "Transaction ID", "Status"];
                const rows = donations.map((d) => [
                  new Date(d.createdAt).toLocaleString("en-IN"),
                  d.name,
                  d.email,
                  d.phone,
                  d.amount,
                  d.method.toUpperCase(),
                  d.transactionId,
                  d.status.toUpperCase(),
                ]);
                const csv = [headers, ...rows]
                  .map((row) => row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(","))
                  .join("\n");
                const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = "donation-reports-registry.csv";
                link.click();
                URL.revokeObjectURL(url);
              }}
            >
              Export CSV
            </button>
          </div>

          {donations.length === 0 ? (
            <div className="empty-state">
              <h3>No donation reports</h3>
              <p>No manual donation reports have been submitted yet.</p>
            </div>
          ) : (
            <div className="card" style={{ padding: 0, overflow: "hidden", overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", minWidth: "850px" }}>
                <thead>
                  <tr style={{ background: "rgba(0,0,0,0.02)", borderBottom: "1px solid var(--border-light)" }}>
                    <th style={{ padding: "12px 16px", fontSize: "0.85rem", fontWeight: 700, color: "var(--text-muted)" }}>Date</th>
                    <th style={{ padding: "12px 16px", fontSize: "0.85rem", fontWeight: 700, color: "var(--text-muted)" }}>Donor Name</th>
                    <th style={{ padding: "12px 16px", fontSize: "0.85rem", fontWeight: 700, color: "var(--text-muted)" }}>Email & Phone</th>
                    <th style={{ padding: "12px 16px", fontSize: "0.85rem", fontWeight: 700, color: "var(--text-muted)" }}>Amount (INR)</th>
                    <th style={{ padding: "12px 16px", fontSize: "0.85rem", fontWeight: 700, color: "var(--text-muted)" }}>Method</th>
                    <th style={{ padding: "12px 16px", fontSize: "0.85rem", fontWeight: 700, color: "var(--text-muted)" }}>Transaction ID</th>
                    <th style={{ padding: "12px 16px", fontSize: "0.85rem", fontWeight: 700, color: "var(--text-muted)" }}>Status</th>
                    <th style={{ padding: "12px 16px", fontSize: "0.85rem", fontWeight: 700, color: "var(--text-muted)", textAlign: "center" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {donations.map((d, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid var(--border-light)", background: d.status === "pending" ? "rgba(140,36,36,0.015)" : "inherit" }}>
                      <td style={{ padding: "12px 16px", fontSize: "0.9rem" }}>
                        {new Date(d.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: "0.95rem", fontWeight: 600 }}>{d.name}</td>
                      <td style={{ padding: "12px 16px", fontSize: "0.9rem" }}>
                        <div>{d.email}</div>
                        <div style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginTop: "2px" }}>{d.phone}</div>
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: "0.95rem", fontWeight: 700, color: "var(--primary)" }}>₹{d.amount}</td>
                      <td style={{ padding: "12px 16px", fontSize: "0.85rem" }}>
                        <span style={{ textTransform: "uppercase", fontWeight: 600, background: "var(--bg)", padding: "2px 6px", borderRadius: "4px", border: "1px solid var(--border)" }}>
                          {d.method}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: "0.9rem", fontFamily: "monospace" }}>{d.transactionId}</td>
                      <td style={{ padding: "12px 16px", fontSize: "0.9rem" }}>
                        <span className={`status-badge status-${d.status}`} style={{ textTransform: "uppercase" }}>
                          {d.status}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "center" }}>
                        {d.status === "pending" ? (
                          <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                            <button
                              className="btn btn-primary btn-xs"
                              onClick={() => handleApproveDonation(d.id)}
                              style={{ background: "#2e7d32", borderColor: "#2e7d32", padding: "4px 8px", fontSize: "0.75rem", color: "white" }}
                            >
                              Approve
                            </button>
                            <button
                              className="btn btn-outline btn-xs"
                              onClick={() => handleRejectDonation(d.id)}
                              style={{ color: "#c62828", borderColor: "#c62828", padding: "4px 8px", fontSize: "0.75rem", background: "none" }}
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                            Verified
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === "queries" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ margin: 0 }}>Revision Requests</h3>
          </div>

          {revisionRequests.length === 0 ? (
            <div className="card" style={{ padding: "48px 20px", textAlign: "center", border: "1px dashed var(--border)" }}>
              <p style={{ color: "var(--text-secondary)", margin: 0 }}>
                No pending user revision or cancellation requests.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {revisionRequests.map((request) => {
                const cat = CATEGORY_META[request.category];
                return (
                  <div key={request.id} className="card" style={{ padding: "24px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px", marginBottom: "16px" }}>
                      <div>
                        <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap", marginBottom: "8px" }}>
                          <span className="tag" style={{ background: cat ? cat.color + "15" : "rgba(0,0,0,0.05)", color: cat ? cat.color : "inherit" }}>
                            {cat ? `${cat.emoji} ${cat.label}` : "Task"}
                          </span>
                          <span className="tag" style={{ background: "rgba(245, 158, 11, 0.1)", color: "var(--warning)" }}>
                            Action Requested: {request.userQueryAction === "delete" ? "Delete / Cancel" : "Edit Proposal"}
                          </span>
                        </div>
                        <h3 style={{ color: "var(--text)", fontWeight: 700, margin: 0 }}>{request.title}</h3>
                        <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "4px", margin: 0 }}>
                          Proposed by: {request.applicantName} ({request.email})
                        </p>
                      </div>
                      <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                        Current Status: <strong style={{ textTransform: "capitalize" }}>{request.status}</strong>
                      </span>
                    </div>

                    <div style={{ background: "rgba(245, 158, 11, 0.03)", border: "1px solid rgba(245, 158, 11, 0.2)", borderRadius: "12px", padding: "16px", marginBottom: "20px" }}>
                      <strong style={{ fontSize: "0.85rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
                        Reason for request:
                      </strong>
                      <span style={{ fontSize: "0.9rem", color: "var(--text)", fontStyle: "italic" }}>
                        "{request.userQueryReason}"
                      </span>
                    </div>

                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                      {request.userQueryAction === "edit" && (
                        <button
                          onClick={() => handleAllowEdit(request.id)}
                          className="btn btn-primary btn-sm"
                        >
                          Allow User to Edit
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteProposal(request.id)}
                        className="btn btn-sm"
                        style={{ background: "rgba(239, 68, 68, 0.08)", color: "var(--danger)", border: "1px solid rgba(239, 68, 68, 0.2)" }}
                      >
                        Delete Proposal (Archive)
                      </button>
                      <button
                        onClick={() => handleResolveQuery(request.id)}
                        className="btn btn-secondary btn-sm"
                      >
                        Dismiss / Resolve Request
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* DELETE PROMPT MODAL OVERLAY */}
      {isDeletePromptOpen && (
        <div style={modalOverlayStyle}>
          <div style={{ ...modalContentStyle, maxWidth: "460px", padding: "28px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text)", margin: 0 }}>
                Archive & Delete Proposal
              </h3>
              <button
                onClick={() => {
                  setIsDeletePromptOpen(false);
                  setProposalIdToDelete(null);
                  setDeletionReason("");
                }}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}
              >
                <X size={20} />
              </button>
            </div>
            <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", marginBottom: "16px", lineHeight: "1.5" }}>
              Please specify the reason for deleting and archiving this proposal:
            </p>
            <div style={{ marginBottom: "20px" }}>
              <textarea
                required
                rows={3}
                value={deletionReason}
                onChange={(e) => setDeletionReason(e.target.value)}
                placeholder="e.g., Requested by user / Inappropriate content..."
                style={{
                  width: "100%",
                  borderRadius: "8px",
                  border: "1px solid var(--border)",
                  padding: "10px",
                  fontSize: "0.9rem",
                  fontFamily: "inherit",
                  resize: "vertical"
                }}
              />
            </div>
            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => {
                  setIsDeletePromptOpen(false);
                  setProposalIdToDelete(null);
                  setDeletionReason("");
                }}
                className="btn btn-secondary btn-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteProposal}
                className="btn btn-sm"
                style={{ background: "var(--danger)", color: "white" }}
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Edit Details Modal */}
      {isEditModalOpen && editingProposal && (
        <div className="modal-overlay" onClick={() => { setIsEditModalOpen(false); setEditingProposal(null); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "700px", width: "95%" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--primary)" }}>✏️ Edit Proposal Details</h2>
              <button
                type="button"
                onClick={() => { setIsEditModalOpen(false); setEditingProposal(null); }}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.25rem" }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditProposal} style={{ maxHeight: "calc(100vh - 200px)", overflowY: "auto", paddingRight: "8px" }}>
              {editingProposal.applicantType === "group" && (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                    <div className="form-group">
                      <label htmlFor="editOrgName" style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "4px" }}>
                        Organization Name <span className="required">*</span>
                      </label>
                      <input
                        type="text"
                        id="editOrgName"
                        required
                        value={editOrgName}
                        onChange={(e) => setEditOrgName(e.target.value)}
                        style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)" }}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="editOrgType" style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "4px" }}>
                        Organization Type <span className="required">*</span>
                      </label>
                      <select
                        id="editOrgType"
                        required
                        value={editOrgType}
                        onChange={(e) => setEditOrgType(e.target.value)}
                        style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", background: "white" }}
                      >
                        <option value="" disabled>Select organization type</option>
                        <option value="Corporate">Corporate</option>
                        <option value="NGO / NPO">NGO / NPO</option>
                        <option value="Government">Government</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-group" style={{ marginBottom: "16px" }}>
                    <label htmlFor="editDesignation" style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "4px" }}>
                      Your Designation <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      id="editDesignation"
                      required
                      value={editDesignation}
                      onChange={(e) => setEditDesignation(e.target.value)}
                      style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)" }}
                    />
                  </div>
                </>
              )}

              <div className="form-group" style={{ marginBottom: "16px" }}>
                <label htmlFor="editTitle" style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "4px" }}>
                  Initiative Title <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="editTitle"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "16px" }}>
                <div className="form-group">
                  <label htmlFor="editCategory" style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "4px" }}>
                    Category <span className="required">*</span>
                  </label>
                  <select
                    id="editCategory"
                    required
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", background: "white" }}
                  >
                    <option value="cleanliness">Cleanliness & Waste Management</option>
                    <option value="plantation">Plantation & Environment</option>
                    <option value="education">Education & Tutoring</option>
                    <option value="animal-welfare">Animal Welfare</option>
                    <option value="community-help">Community Care & Help</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="editEventDuration" style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "4px" }}>
                    Duration of Event <span className="required">*</span>
                  </label>
                  <select
                    id="editEventDuration"
                    required
                    value={editEventDuration}
                    onChange={(e) => setEditEventDuration(parseInt(e.target.value) || 1)}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", background: "white" }}
                  >
                    <option value={1}>1 day</option>
                    <option value={2}>2 days</option>
                    <option value={3}>3 days</option>
                    <option value={4}>4 days</option>
                    <option value={5}>5 days</option>
                    <option value={6}>6 days</option>
                    <option value={7}>7 days</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="editVolunteersNeeded" style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "4px" }}>
                    Volunteers Needed <span className="required">*</span>
                  </label>
                  <input
                    type="number"
                    id="editVolunteersNeeded"
                    required
                    min="1"
                    value={editVolunteersNeeded}
                    onChange={(e) => setEditVolunteersNeeded(parseInt(e.target.value) || 1)}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "16px" }}>
                <div className="form-group">
                  <label htmlFor="editEventDate" style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "4px" }}>
                    Proposed Date <span className="required">*</span>
                  </label>
                  <input
                    type="date"
                    id="editEventDate"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={editEventDate}
                    onChange={(e) => setEditEventDate(e.target.value)}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)" }}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="editEventTime" style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "4px" }}>
                    Proposed Time (Optional)
                  </label>
                  <input
                    type="time"
                    id="editEventTime"
                    value={editEventTime}
                    onChange={(e) => setEditEventTime(e.target.value)}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)" }}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: "16px" }}>
                <label htmlFor="editShortDescription" style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "4px" }}>
                  Short Description <span className="required">*</span>
                </label>
                <textarea
                  id="editShortDescription"
                  required
                  maxLength={200}
                  rows={2}
                  value={editShortDescription}
                  onChange={(e) => setEditShortDescription(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", fontFamily: "inherit" }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: "16px" }}>
                <label htmlFor="editDescription" style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "4px" }}>
                  Detailed Description <span className="required">*</span>
                </label>
                <textarea
                  id="editDescription"
                  required
                  maxLength={1500}
                  rows={5}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", fontFamily: "inherit" }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: "16px" }}>
                <label htmlFor="editAddress" style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "4px" }}>
                  Full Address <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="editAddress"
                  required
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "16px", marginBottom: "20px" }}>
                <div className="form-group">
                  <label htmlFor="editLocality" style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "4px" }}>
                    Locality / Area <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="editLocality"
                    required
                    value={editLocality}
                    onChange={(e) => setEditLocality(e.target.value)}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)" }}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="editPincode" style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "4px" }}>
                    Pincode <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="editPincode"
                    required
                    value={editPincode}
                    onChange={(e) => setEditPincode(e.target.value)}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)" }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "24px" }}>
                <button
                  type="button"
                  onClick={() => { setIsEditModalOpen(false); setEditingProposal(null); }}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Proposal Rejection Reason Modal */}
      {isAdminRejectModalOpen && (
        <div className="modal-overlay" onClick={() => { setIsAdminRejectModalOpen(false); setAdminRejectProposalId(null); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "500px", width: "90%", padding: "24px" }}>
            <h3 style={{ fontSize: "1.15rem", fontWeight: 700, color: "var(--danger)", marginBottom: "12px" }}>
              Reject Initiative Proposal (Admin Review)
            </h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "16px" }}>
              Please specify the reason for declining this campaign proposal. This reason will be emailed to the proposer and displayed on their dashboard.
            </p>
            <div className="form-group" style={{ marginBottom: "20px" }}>
              <label htmlFor="adminProposalRejectionReason" style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
                Rejection Reason:
              </label>
              <textarea
                id="adminProposalRejectionReason"
                rows={4}
                placeholder="e.g. Content policy violation or redundant initiative..."
                value={adminProposalRejectionReason}
                onChange={(e) => setAdminProposalRejectionReason(e.target.value)}
                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", resize: "vertical", fontSize: "0.9rem", fontFamily: "inherit" }}
              />
            </div>
            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => { setIsAdminRejectModalOpen(false); setAdminRejectProposalId(null); }}
                className="btn btn-secondary btn-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmAdminRejectProposal}
                className="btn btn-sm"
                style={{ background: "var(--danger)", color: "white" }}
              >
                Reject Proposal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

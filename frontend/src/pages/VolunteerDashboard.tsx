import { useState, useEffect } from "react";
import {
  getPendingTasks,
  updateTaskStatus,
  getVolunteerApps,
  updateVolunteerAppStatus,
  addConversationUpdate,
  requestTaskDetails,
  getTasks,
  getGeneralPartners,
  updatePartnerStatus,
  allowUserEditProposal,
  resolveUserQuery,
  deleteProposal,
  adminEditProposal,
  sendTaskChatMessage,
  slugify,
} from "../store";
import { TaskRequest, VolunteerApp, ApplicationStatus, GeneralPartner, CATEGORY_META, ChatMessage } from "../types";
import { X } from "lucide-react";
import { RichTextEditor, RichTextDisplay } from "../components/RichTextEditor";

interface VolunteerDashboardProps {
  addToast: (msg: string, type: "success" | "error" | "info") => void;
}

export default function VolunteerDashboard({
  addToast,
}: VolunteerDashboardProps) {
  const [activeTab, setActiveTab] = useState<"proposals" | "applications" | "partners" | "queries">(
    "proposals",
  );
  const [proposals, setProposals] = useState<TaskRequest[]>([]);
  const [applications, setApplications] = useState<VolunteerApp[]>([]);
  const [expandedLogs, setExpandedLogs] = useState<Record<string, boolean>>({});
  const [newLogText, setNewLogText] = useState<Record<string, string>>({});
  const [partners, setPartners] = useState<GeneralPartner[]>([]);
  const [revisionRequests, setRevisionRequests] = useState<TaskRequest[]>([]);
  const [appStatusFilter, setAppStatusFilter] = useState<
    ApplicationStatus | "all"
  >("all");
  const [proposalStatusFilter, setProposalStatusFilter] = useState<string>("pending");
  const [appEventFilter, setAppEventFilter] = useState<string>("all");

  useEffect(() => {
    loadData();
  }, [proposalStatusFilter]);

  const loadData = () => {
    const allTasks = getTasks();
    const filteredTasks = allTasks.filter((t) => {
      if (proposalStatusFilter === "all") return true;
      return t.status === proposalStatusFilter;
    });
    setProposals(filteredTasks);
    setApplications(getVolunteerApps());
    getGeneralPartners().then(setPartners);

    const queries = allTasks.filter((t) => t.userQueryStatus === "pending");
    setRevisionRequests(queries);
  };

  const [requestTexts, setRequestTexts] = useState<Record<string, string>>({});
  const [sendingRequestId, setSendingRequestId] = useState<string | null>(null);

  // Delete prompt state
  const [isDeletePromptOpen, setIsDeletePromptOpen] = useState(false);
  const [proposalIdToDelete, setProposalIdToDelete] = useState<string | null>(null);
  const [deletionReason, setDeletionReason] = useState("");

  // Rejection states
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectProposalId, setRejectProposalId] = useState<string | null>(null);
  const [proposalRejectionReason, setProposalRejectionReason] = useState("");

  const [isAppRejectModalOpen, setIsAppRejectModalOpen] = useState(false);
  const [rejectAppId, setRejectAppId] = useState<string | null>(null);
  const [appRejectionReason, setAppRejectionReason] = useState("");

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

    const shortClean = editShortDescription.replace(/<[^>]*>/g, "").trim();
    const descClean = editDescription.replace(/<[^>]*>/g, "").trim();

    if (!shortClean) {
      addToast("Short Description is required.", "error");
      return;
    }
    if (!descClean) {
      addToast("Detailed Description is required.", "error");
      return;
    }

    if (!editPincode.trim().startsWith("11")) {
      addToast("Not a Delhi pincode. This platform only supports Delhi initiatives.", "error");
      return;
    }

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
      loadData();
    } catch (error) {
      addToast("Failed to update proposal details.", "error");
    }
  };

  const getTaskMessages = (p: TaskRequest) => {
    const messages: any[] = [];
    if (p.moderatorRequest) {
      messages.push({
        id: "legacy-mod",
        sender: "moderator",
        senderName: "Moderator",
        text: p.moderatorRequest,
        timestamp: p.createdAt
      });
    }
    if (p.userResponse) {
      messages.push({
        id: "legacy-user",
        sender: "user",
        senderName: p.applicantName,
        text: p.userResponse,
        timestamp: p.createdAt
      });
    }
    if (p.chatMessages && p.chatMessages.length > 0) {
      messages.push(...p.chatMessages);
    }
    return messages;
  };

  const handleRequestMsgChange = (taskId: string, text: string) => {
    setRequestTexts((prev) => ({ ...prev, [taskId]: text }));
  };

  const handleSendRequest = async (taskId: string) => {
    const text = requestTexts[taskId]?.trim();
    if (!text) {
      addToast("Please enter a message.", "info");
      return;
    }

    setSendingRequestId(taskId);
    try {
      await sendTaskChatMessage(taskId, "moderator", "Moderator", text);
      addToast("Message sent to user.", "success");
      loadData();
      setRequestTexts((prev) => ({ ...prev, [taskId]: "" }));
    } catch (error) {
      addToast("Failed to send message.", "error");
    } finally {
      setSendingRequestId(null);
    }
  };

  const handleVerifyProposal = (id: string) => {
    updateTaskStatus(id, "verified");
    addToast("Proposal marked as verified. Sent to Admin queue.", "success");
    loadData();
  };

  const handleRejectProposal = (id: string) => {
    setRejectProposalId(id);
    setProposalRejectionReason("");
    setIsRejectModalOpen(true);
  };

  const confirmRejectProposal = () => {
    if (!rejectProposalId || !proposalRejectionReason.trim()) {
      addToast("Please provide a rejection reason.", "info");
      return;
    }
    updateTaskStatus(rejectProposalId, "rejected", proposalRejectionReason.trim());
    addToast("Proposal rejected.", "info");
    setIsRejectModalOpen(false);
    setRejectProposalId(null);
    setProposalRejectionReason("");
    loadData();
  };

  const handleAllowEdit = async (taskId: string) => {
    try {
      await allowUserEditProposal(taskId);
      addToast("Granted edit permission to user.", "success");
      loadData();
    } catch (error) {
      addToast("Failed to allow user to edit.", "error");
    }
  };

  const handleResolveQuery = async (taskId: string) => {
    try {
      await resolveUserQuery(taskId);
      addToast("Request marked as resolved.", "info");
      loadData();
    } catch (error) {
      addToast("Failed to resolve request.", "error");
    }
  };

  const handleDeleteProposal = (taskId: string) => {
    setProposalIdToDelete(taskId);
    setDeletionReason("Moderator deleted initiative");
    setIsDeletePromptOpen(true);
  };

  const confirmDeleteProposal = async () => {
    if (!proposalIdToDelete) return;
    try {
      await deleteProposal(proposalIdToDelete, "Moderator", deletionReason || "Deleted by moderator");
      addToast("Proposal deleted and archived successfully.", "success");
      setIsDeletePromptOpen(false);
      setProposalIdToDelete(null);
      setDeletionReason("");
      loadData();
    } catch (error) {
      addToast("Failed to delete proposal.", "error");
    }
  };

  const handleApproveApp = (id: string) => {
    updateVolunteerAppStatus(id, "approved");
    addToast("Application approved successfully.", "success");
    loadData();
  };

  const handleRejectApp = (id: string) => {
    setRejectAppId(id);
    setAppRejectionReason("");
    setIsAppRejectModalOpen(true);
  };

  const confirmRejectApp = () => {
    if (!rejectAppId || !appRejectionReason.trim()) {
      addToast("Please provide a rejection reason.", "info");
      return;
    }
    updateVolunteerAppStatus(rejectAppId, "rejected", appRejectionReason.trim());
    addToast("Application rejected.", "error");
    setIsAppRejectModalOpen(false);
    setRejectAppId(null);
    setAppRejectionReason("");
    loadData();
  };

  const handleAddLogEntry = async (appId: string) => {
    const text = newLogText[appId];
    if (!text || !text.trim()) return;

    try {
      await addConversationUpdate(appId, text.trim());
      setNewLogText({ ...newLogText, [appId]: "" });
      loadData();
      addToast("Log entry added successfully.", "success");
    } catch (err: any) {
      addToast(err.message || "Failed to add log entry", "error");
    }
  };

  const toggleContactLog = (appId: string) => {
    setExpandedLogs((prev) => ({ ...prev, [appId]: !prev[appId] }));
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

  const filteredApps = applications
    .filter((app) => appStatusFilter === "all" || app.status === appStatusFilter)
    .filter((app) => appEventFilter === "all" || app.taskId === appEventFilter);

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
  const verifiedProposalsCount = getTasks().filter(
    (t) => t.status === "verified" || t.status === "approved" || t.status === "completed"
  ).length;

  const verifiedAppsCount = getVolunteerApps().filter(
    (app) => app.status === "interviewing" || app.status === "approved"
  ).length;

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
    <div className="page-container page-enter">
      <div className="container" style={{ padding: "40px 20px" }}>
        <h1 className="page-title" style={{ marginBottom: "8px" }}>
          Moderator <span style={{ color: "var(--primary)" }}>Dashboard</span>
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", marginBottom: "28px" }}>
          Screen community proposals and verify volunteer applications
        </p>

        {/* Stats Row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "16px",
            marginBottom: "32px",
          }}
        >
          <div className="card" style={{ padding: "20px", display: "flex", alignItems: "center", gap: "16px", border: "1px solid var(--border-light)" }}>
            <div>
              <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--text)" }}>
                {proposals.length}
              </div>
              <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500 }}>
                Pending Proposals Review
              </div>
            </div>
          </div>
          
          <div className="card" style={{ padding: "20px", display: "flex", alignItems: "center", gap: "16px", border: "1px solid var(--border-light)" }}>
            <div>
              <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--primary)" }}>
                {verifiedProposalsCount}
              </div>
              <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500 }}>
                Proposals Verified & Sent
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: "20px", display: "flex", alignItems: "center", gap: "16px", border: "1px solid var(--border-light)" }}>
            <div>
              <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--primary)" }}>
                {verifiedAppsCount}
              </div>
              <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500 }}>
                Applications Screened & Sent
              </div>
            </div>
          </div>
        </div>

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
          <button
            className={`filter-chip ${activeTab === "partners" ? "active" : ""}`}
            onClick={() => setActiveTab("partners")}
          >
            Partnership Requests ({partners.length})
          </button>
          <button
            className={`filter-chip ${activeTab === "queries" ? "active" : ""}`}
            onClick={() => setActiveTab("queries")}
          >
            User Queries ({revisionRequests.length})
          </button>
        </div>

        {activeTab === "proposals" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, gap: 12, flexWrap: "wrap" }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <h3 style={{ margin: 0 }}>Campaign Proposals</h3>
                <select
                  value={proposalStatusFilter}
                  onChange={(e) => setProposalStatusFilter(e.target.value)}
                  style={{ padding: "6px 12px", borderRadius: "20px", border: "1px solid var(--border)", fontSize: "0.85rem", background: "white", width: "auto" }}
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending review</option>
                  <option value="approved">Approved/Live</option>
                  <option value="rejected">Rejected</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => {
                  const headers = ["ID", "Title", "Category", "Status", "Date", "Time", "Volunteers Needed", "Locality", "Pincode", "Applicant Name", "Email", "Phone", "Created At"];
                  const rows = proposals.map((t) => [
                    t.id,
                    t.title,
                    t.category,
                    t.status,
                    t.eventDate || "",
                    t.eventTime || "",
                    t.volunteersNeeded,
                    t.locality || "",
                    t.pincode || "",
                    t.applicantName || "",
                    t.email || "",
                    t.phone || "",
                    new Date(t.createdAt).toLocaleString("en-IN")
                  ]);
                  const csv = [headers, ...rows]
                    .map((row) => row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(","))
                    .join("\n");
                  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement("a");
                  link.href = url;
                  link.download = `moderator-campaign-proposals-status-${proposalStatusFilter}.csv`;
                  link.click();
                  URL.revokeObjectURL(url);
                }}
              >
                Export CSV
              </button>
            </div>

            <div className="grid">
              {proposals.length === 0 ? (
                <p style={{ color: "var(--text-secondary)" }}>
                  No campaign proposals match the selected filter.
                </p>
              ) : (
              proposals.map((proposal) => (
                <div key={proposal.id} className="card">
                  <h3 style={{ marginBottom: "6px" }}>{proposal.title}</h3>
                  <p
                    style={{
                      fontSize: "0.85rem",
                      color: "var(--text-secondary)",
                      marginBottom: "14px",
                    }}
                  >
                    By: {proposal.applicantName} ({proposal.email})
                  </p>
                  
                  {proposal.shortDescription && (
                    <div style={{ marginBottom: "12px", fontSize: "0.9rem" }}>
                      <strong style={{ color: "var(--text-secondary)", fontSize: "0.82rem" }}>Short Description:</strong>
                      <div style={{ margin: "2px 0 0 0", color: "var(--text-secondary)", fontStyle: "italic" }}>
                        <RichTextDisplay content={proposal.shortDescription} />
                      </div>
                    </div>
                  )}

                  <div style={{ marginBottom: "14px", fontSize: "0.9rem" }}>
                    <strong style={{ color: "var(--text-secondary)", fontSize: "0.82rem" }}>Detailed Description:</strong>
                    <div style={{ margin: "2px 0 0 0", color: "var(--text)", lineHeight: "1.5" }}>
                      <RichTextDisplay content={proposal.description} />
                    </div>
                  </div>

                  <div 
                    style={{ 
                      display: "grid", 
                      gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", 
                      gap: "14px", 
                      background: "rgba(0,0,0,0.02)", 
                      padding: "16px", 
                      borderRadius: "12px", 
                      marginBottom: "20px",
                      border: "1px solid var(--border-light)",
                      fontSize: "0.85rem",
                      marginTop: "14px"
                    }}
                  >
                    <div>
                      <strong style={{ color: "var(--text-secondary)" }}>Category:</strong>
                      <div style={{ textTransform: "capitalize", marginTop: "2px", fontWeight: 600 }}>
                        {proposal.category}
                      </div>
                    </div>
                    <div>
                      <strong style={{ color: "var(--text-secondary)" }}>Applicant:</strong>
                      <div style={{ textTransform: "capitalize", marginTop: "2px", fontWeight: 600 }}>
                        {proposal.applicantType === "group" ? `Group: ${proposal.organizationName || 'Organization'}${proposal.organizationType ? ` (${proposal.organizationType})` : ''}${proposal.designation ? ` (${proposal.designation})` : ''}` : 'Individual'}
                      </div>
                    </div>
                    <div>
                      <strong style={{ color: "var(--text-secondary)" }}>Phone Number:</strong>
                      <div style={{ marginTop: "2px", fontWeight: 600 }}>
                        {proposal.phone || "N/A"}
                      </div>
                    </div>
                    <div>
                      <strong style={{ color: "var(--text-secondary)" }}>Volunteers Requested:</strong>
                      <div style={{ marginTop: "2px", fontWeight: 600 }}>
                        {proposal.volunteersNeeded} volunteers
                      </div>
                    </div>
                    <div>
                      <strong style={{ color: "var(--text-secondary)" }}>Proposed Date & Time:</strong>
                      <div style={{ marginTop: "2px", fontWeight: 600 }}>
                        {proposal.eventDate ? `${new Date(proposal.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} at ${proposal.eventTime || 'To be Decided'}` : "N/A"}
                      </div>
                    </div>
                    <div>
                      <strong style={{ color: "var(--text-secondary)" }}>Locality & Pincode:</strong>
                      <div style={{ marginTop: "2px", fontWeight: 600 }}>
                        {proposal.locality} {proposal.pincode ? `(${proposal.pincode})` : ''}
                      </div>
                    </div>
                    <div style={{ gridColumn: "1 / -1" }}>
                      <strong style={{ color: "var(--text-secondary)" }}>Full Map Address:</strong>
                      <div style={{ marginTop: "2px", fontWeight: 500, lineHeight: "1.4" }}>
                        {proposal.address || "N/A"}
                      </div>
                    </div>
                  </div>

                  {/* Moderator Chat Discussion Section */}
                  <div style={{ marginTop: "20px", borderTop: "1px solid var(--border-light)", paddingTop: "20px", marginBottom: "20px" }}>
                    <h4 style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text)", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                      💬 Discussion with Proposer
                    </h4>
                    
                    {/* Chat Bubble Container */}
                    <div 
                      style={{ 
                        maxHeight: "260px", 
                        overflowY: "auto", 
                        background: "rgba(0,0,0,0.01)", 
                        border: "1px solid var(--border-light)", 
                        borderRadius: "12px", 
                        padding: "16px", 
                        display: "flex", 
                        flexDirection: "column", 
                        gap: "12px",
                        marginBottom: "12px"
                      }}
                    >
                      {getTaskMessages(proposal).length === 0 ? (
                        <div style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                          No messages yet. Send a message to request additional info or clarify proposal details.
                        </div>
                      ) : (
                        getTaskMessages(proposal).map((msg: any) => {
                          const isMod = msg.sender === "moderator";
                          return (
                            <div 
                              key={msg.id} 
                              style={{ 
                                display: "flex", 
                                flexDirection: "column", 
                                alignSelf: isMod ? "flex-end" : "flex-start",
                                maxWidth: "75%"
                              }}
                            >
                              <div style={{ 
                                fontSize: "0.75rem", 
                                color: "var(--text-secondary)", 
                                marginBottom: "3px", 
                                alignSelf: isMod ? "flex-end" : "flex-start",
                                fontWeight: 600
                              }}>
                                {msg.senderName}
                              </div>
                              <div 
                                style={{ 
                                  padding: "10px 14px", 
                                  borderRadius: "14px", 
                                  borderTopRightRadius: isMod ? "2px" : "14px",
                                  borderTopLeftRadius: !isMod ? "2px" : "14px",
                                  background: isMod ? "var(--primary)" : "white", 
                                  color: isMod ? "white" : "var(--text)",
                                  fontSize: "0.88rem",
                                  lineHeight: "1.4",
                                  border: isMod ? "none" : "1px solid var(--border)",
                                  boxShadow: "0 1px 2px rgba(0,0,0,0.02)"
                                }}
                              >
                                {msg.text}
                              </div>
                              <div style={{ 
                                fontSize: "0.7rem", 
                                color: "var(--text-muted)", 
                                marginTop: "3px", 
                                alignSelf: isMod ? "flex-end" : "flex-start" 
                              }}>
                                {new Date(msg.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Chat Input Bar */}
                    <div style={{ display: "flex", gap: "8px" }}>
                      <input
                        type="text"
                        placeholder="Type a message to discuss with the proposer..."
                        value={requestTexts[proposal.id] || ""}
                        onChange={(e) => handleRequestMsgChange(proposal.id, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleSendRequest(proposal.id);
                          }
                        }}
                        style={{ 
                          flex: 1, 
                          height: "40px", 
                          fontSize: "0.88rem", 
                          padding: "0 14px", 
                          borderRadius: "8px", 
                          border: "1px solid var(--border)",
                          outline: "none"
                        }}
                      />
                      <button
                        onClick={() => handleSendRequest(proposal.id)}
                        disabled={sendingRequestId === proposal.id}
                        className="btn btn-primary"
                        style={{ height: "40px", padding: "0 16px", whiteSpace: "nowrap" }}
                      >
                        {sendingRequestId === proposal.id ? "Sending..." : "Send"}
                      </button>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleVerifyProposal(proposal.id)}
                    >
                      Verify (Send to Admin)
                    </button>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => handleStartEditProposal(proposal)}
                      style={{ color: "var(--primary)", borderColor: "var(--primary)" }}
                    >
                      ✏️ Edit Details
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
        </div>
      )}

        {activeTab === "applications" && (
          <div>
            <div style={{ display: "flex", gap: 8, marginBottom: 16, alignItems: "center", flexWrap: "wrap" }}>
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

              <select
                value={appEventFilter}
                onChange={(e) => setAppEventFilter(e.target.value)}
                style={{ padding: "6px 12px", borderRadius: "20px", border: "1px solid var(--border)", fontSize: "0.85rem", background: "white", width: "auto" }}
              >
                <option value="all">All Campaigns</option>
                {getTasks().filter(t => t.status === "approved" || t.status === "completed").map(t => (
                  <option key={t.id} value={t.id}>{t.title}</option>
                ))}
              </select>

              <button
                className="btn btn-outline btn-sm"
                onClick={() => {
                  const eventSlug = appEventFilter === "all" ? "all" : slugify(getTasks().find(t => t.id === appEventFilter)?.title || "");
                  const filename = `moderator-volunteer-apps-event-${eventSlug}-status-${appStatusFilter}.csv`;
                  exportApplications(filteredApps, filename);
                }}
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
                        <p style={{ margin: "4px 0", fontSize: "0.85rem", color: "var(--primary)", fontWeight: 600 }}>
                          For Task: {app.taskTitle || "Unknown Task"}
                        </p>
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
                        {app.status === "applied" && (
                          <div style={{ display: "flex", gap: 8 }}>
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => handleApproveApp(app.id)}
                            >
                              Approve
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
                    {/* Contact History & Log Section */}
                    <div style={{ marginTop: 16, borderTop: "1px dashed var(--border-light)", paddingTop: 12 }}>
                      {/* Header with expand/collapse */}
                      <div 
                        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
                        onClick={() => toggleContactLog(app.id)}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.85rem", fontWeight: 600, color: "var(--primary)" }}>
                          <span>💬 Contact & Conversation History</span>
                          {app.conversationUpdates && app.conversationUpdates.length > 0 && (
                            <span style={{ background: "var(--primary-light)", color: "white", borderRadius: "10px", padding: "2px 6px", fontSize: "0.75rem" }}>
                              {app.conversationUpdates.length}
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                          {expandedLogs[app.id] ? "Hide Details ▲" : "Show Details ▼"}
                        </span>
                      </div>

                      {/* Summary of latest update (if collapsed and exists) */}
                      {!expandedLogs[app.id] && app.conversationUpdates && app.conversationUpdates.length > 0 && (
                        <div style={{ marginTop: 6, fontSize: "0.8rem", color: "var(--text-secondary)", background: "rgba(0,0,0,0.02)", padding: "6px 10px", borderRadius: 6 }}>
                          <strong>Latest update:</strong> "{app.conversationUpdates[app.conversationUpdates.length - 1].notes}" by {app.conversationUpdates[app.conversationUpdates.length - 1].userName} ({new Date(app.conversationUpdates[app.conversationUpdates.length - 1].createdAt).toLocaleDateString('en-IN')})
                        </div>
                      )}

                      {/* Detailed Log History & Add Log Form */}
                      {expandedLogs[app.id] && (
                        <div style={{ marginTop: 12 }}>
                          {/* Timeline of past updates */}
                          <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 200, overflowY: "auto", paddingRight: 4, marginBottom: 12 }}>
                            {!app.conversationUpdates || app.conversationUpdates.length === 0 ? (
                              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontStyle: "italic", padding: "4px 0" }}>
                                No contact history recorded yet.
                              </div>
                            ) : (
                              [...app.conversationUpdates].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()).map((up, idx) => (
                                <div 
                                  key={up._id || idx} 
                                  style={{ 
                                    padding: "8px 10px", 
                                    background: up.role === "SYSTEM" ? "rgba(0,0,0,0.02)" : "rgba(140, 36, 36, 0.02)", 
                                    borderLeft: up.role === "SYSTEM" ? "3px solid #ccc" : "3px solid var(--primary)",
                                    borderRadius: "0 6px 6px 0",
                                    fontSize: "0.82rem"
                                  }}
                                >
                                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2, fontSize: "0.78rem" }}>
                                    <span>
                                      <strong>{up.userName}</strong> 
                                      <span style={{ 
                                        marginLeft: 6, 
                                        padding: "1px 4px", 
                                        borderRadius: 4, 
                                        background: up.role === "ADMIN" ? "#ef4444" : up.role === "MODERATOR" ? "#3b82f6" : up.role === "PROPOSAL_OWNER" ? "#10b981" : "#e5e7eb", 
                                        color: ["ADMIN", "MODERATOR", "PROPOSAL_OWNER"].includes(up.role) ? "white" : "#374151", 
                                        fontSize: "0.65rem",
                                        fontWeight: 600
                                      }}>
                                        {up.role === "PROPOSAL_OWNER" ? "OWNER" : up.role}
                                      </span>
                                    </span>
                                    <span style={{ color: "var(--text-muted)" }}>
                                      {new Date(up.createdAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                                    </span>
                                  </div>
                                  <div style={{ color: "var(--text)", lineHeight: 1.3 }}>{up.notes}</div>
                                </div>
                              ))
                            )}
                          </div>

                          {/* Add note form */}
                          <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                            <textarea
                              placeholder="Type a contact update note..."
                              value={newLogText[app.id] || ""}
                              onChange={(e) => setNewLogText({ ...newLogText, [app.id]: e.target.value })}
                              rows={1}
                              style={{ 
                                flex: 1, 
                                padding: "8px 10px", 
                                borderRadius: 6, 
                                border: "1px solid var(--border)", 
                                fontSize: "0.82rem", 
                                resize: "none",
                                height: "36px",
                                lineHeight: "18px",
                                fontFamily: "inherit"
                              }}
                            />
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => handleAddLogEntry(app.id)}
                              disabled={!newLogText[app.id] || !newLogText[app.id].trim()}
                              style={{ height: "36px", fontSize: "0.8rem", padding: "0 12px" }}
                            >
                              Add Log
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "partners" && (
          <div>
            <div style={{ display: "flex", gap: 8, marginBottom: 16, alignItems: "center" }}>
              <h3 style={{ margin: 0 }}>Partnership Requests Pool</h3>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => {
                  const headers = ["Org Name", "Org Type", "Contact Name", "Designation", "Email", "Phone", "Location", "Collab Reason", "Status", "Registered At"];
                  const rows = partners.map((p) => [
                    p.orgName,
                    p.orgType,
                    p.contactName,
                    p.designation,
                    p.email,
                    p.phone,
                    p.location,
                    p.collabReason,
                    p.status || "applied",
                    new Date(p.createdAt || "").toLocaleString("en-IN")
                  ]);
                  const csv = [headers, ...rows]
                    .map((row) => row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(","))
                    .join("\n");
                  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement("a");
                  link.href = url;
                  link.download = "moderator-partnerships-list.csv";
                  link.click();
                  URL.revokeObjectURL(url);
                }}
                style={{ marginLeft: "auto" }}
              >
                Export CSV
              </button>
            </div>

            {partners.length === 0 ? (
              <p style={{ color: "var(--text-secondary)" }}>
                No partnership requests found.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {partners.map((part) => (
                  <div key={part.id} className="card" style={{ padding: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                      <div>
                        <h3 style={{ marginBottom: 6 }}>
                          {part.orgName} <span style={{
                            padding: "2px 8px",
                            borderRadius: "4px",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            background: "var(--border-light)",
                            color: "var(--text-secondary)",
                            marginLeft: "8px"
                          }}>{part.orgType}</span>
                        </h3>
                        {part.taskTitle && (
                          <p style={{ margin: "4px 0", fontSize: "0.85rem", color: "var(--primary)", fontWeight: 600 }}>
                            For Event: {part.taskTitle}
                          </p>
                        )}
                        <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                          <strong>Contact:</strong> {part.contactName} ({part.designation}) · {part.email} · {part.phone}
                        </p>
                        <p style={{ margin: "4px 0 0 0", color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                          <strong>Location:</strong> {part.location}
                        </p>
                        <p style={{ marginTop: 8, fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                          <strong>Collab Proposal:</strong> {part.collabReason}
                        </p>
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", justifyContent: "space-between", minWidth: "160px" }}>
                        <span style={{
                          padding: "4px 8px",
                          borderRadius: "4px",
                          fontSize: "0.8rem",
                          fontWeight: 600,
                          background: part.status === "approved" ? "rgba(16, 185, 129, 0.1)" : part.status === "rejected" ? "rgba(239, 68, 68, 0.1)" : "rgba(245, 158, 11, 0.1)",
                          color: part.status === "approved" ? "var(--success)" : part.status === "rejected" ? "var(--danger)" : "var(--warning)"
                        }}>{part.status === "interviewing" ? "Interviewing" : part.status === "approved" ? "Approved" : part.status === "rejected" ? "Rejected" : "Applied"}</span>

                        <div style={{ display: "flex", gap: "6px", marginTop: "12px" }}>
                          {part.status === "applied" && (
                            <button
                              onClick={async () => {
                                const res = await updatePartnerStatus(part.id || "", "interviewing");
                                if (res.success) {
                                  addToast("Partnership sent to Interview stage", "success");
                                  loadData();
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
                                  loadData();
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
                                  loadData();
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
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "queries" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ margin: 0 }}>User Queries</h3>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => {
                  const headers = ["Campaign Title", "Action Requested", "Reason", "Email", "Proposer Name", "Status"];
                  const rows = revisionRequests.map((r) => [
                    r.title,
                    r.userQueryAction === "delete" ? "Delete / Cancel" : "Edit Proposal",
                    r.userQueryReason || "",
                    r.email,
                    r.applicantName,
                    r.status
                  ]);
                  const csv = [headers, ...rows]
                    .map((row) => row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(","))
                    .join("\n");
                  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement("a");
                  link.href = url;
                  link.download = "moderator-campaign-queries.csv";
                  link.click();
                  URL.revokeObjectURL(url);
                }}
              >
                Export CSV
              </button>
            </div>

            {revisionRequests.length === 0 ? (
              <div className="card" style={{ padding: "48px 20px", textAlign: "center", border: "1px dashed var(--border)" }}>
                <p style={{ color: "var(--text-secondary)", margin: 0 }}>
                  No pending user queries or revision requests.
                </p>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "20px" }}>
                {revisionRequests.map((request) => {
                  const cat = CATEGORY_META[request.category];
                  return (
                    <div key={request.id} className="card" style={{ padding: "28px" }}>
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

        {/* Moderator Edit Details Modal */}
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
                         <div className="form-group" style={{ marginBottom: "16px" }}>
                  <label htmlFor="editShortDescription" style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "4px" }}>
                    Short Description <span className="required">*</span>
                  </label>
                  <RichTextEditor
                    id="editShortDescription"
                    value={editShortDescription}
                    onChange={setEditShortDescription}
                    maxLength={200}
                    placeholder="A brief tagline of your initiative (max 200 characters)"
                    rows={2}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: "16px" }}>
                  <label htmlFor="editDescription" style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "4px" }}>
                    Detailed Description <span className="required">*</span>
                  </label>
                  <RichTextEditor
                    id="editDescription"
                    value={editDescription}
                    onChange={setEditDescription}
                    maxLength={1500}
                    placeholder="Explain the what, where, and why of your initiative (max 1500 characters)"
                    rows={5}
                  />
                </div>          </div>

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

        {/* Proposal Rejection Reason Modal */}
        {isRejectModalOpen && (
          <div className="modal-overlay" onClick={() => { setIsRejectModalOpen(false); setRejectProposalId(null); }}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "500px", width: "90%", padding: "24px" }}>
              <h3 style={{ fontSize: "1.15rem", fontWeight: 700, color: "var(--danger)", marginBottom: "12px" }}>
                Reject Initiative Proposal
              </h3>
              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "16px" }}>
                Please specify the reason for declining this campaign proposal. This reason will be emailed to the proposer and displayed on their dashboard.
              </p>
              <div className="form-group" style={{ marginBottom: "20px" }}>
                <label htmlFor="proposalRejectionReason" style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
                  Rejection Reason:
                </label>
                <textarea
                  id="proposalRejectionReason"
                  rows={4}
                  placeholder="e.g. Incomplete address details or scheduled date falls on a public holiday..."
                  value={proposalRejectionReason}
                  onChange={(e) => setProposalRejectionReason(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", resize: "vertical", fontSize: "0.9rem", fontFamily: "inherit" }}
                />
              </div>
              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => { setIsRejectModalOpen(false); setRejectProposalId(null); }}
                  className="btn btn-secondary btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmRejectProposal}
                  className="btn btn-sm"
                  style={{ background: "var(--danger)", color: "white" }}
                >
                  Reject Proposal
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Volunteer Application Rejection Reason Modal */}
        {isAppRejectModalOpen && (
          <div className="modal-overlay" onClick={() => { setIsAppRejectModalOpen(false); setRejectAppId(null); }}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "500px", width: "90%", padding: "24px" }}>
              <h3 style={{ fontSize: "1.15rem", fontWeight: 700, color: "var(--danger)", marginBottom: "12px" }}>
                Decline Volunteer Application
              </h3>
              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "16px" }}>
                Please specify the reason for declining this volunteering request. The applicant will receive this reason in their notification email.
              </p>
              <div className="form-group" style={{ marginBottom: "20px" }}>
                <label htmlFor="appRejectionReason" style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
                  Reason:
                </label>
                <textarea
                  id="appRejectionReason"
                  rows={4}
                  placeholder="e.g. All slots for this campaign are currently filled..."
                  value={appRejectionReason}
                  onChange={(e) => setAppRejectionReason(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", resize: "vertical", fontSize: "0.9rem", fontFamily: "inherit" }}
                />
              </div>
              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => { setIsAppRejectModalOpen(false); setRejectAppId(null); }}
                  className="btn btn-secondary btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmRejectApp}
                  className="btn btn-sm"
                  style={{ background: "var(--danger)", color: "white" }}
                >
                  Confirm Decline
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

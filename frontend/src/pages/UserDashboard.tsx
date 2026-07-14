import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  getTasks, 
  getCurrentUser, 
  respondToTaskRequest, 
  initStore, 
  getVolunteerApps, 
  getTaskById, 
  slugify,
  editProposal,
  deleteProposal,
  submitUserQuery,
  withdrawVolunteerApp,
  sendTaskChatMessage,
  updateVolunteerAppStatus,
} from "../store";
import { TaskRequest, CATEGORY_META, VolunteerApp, ChatMessage } from "../types";
import ImageCropper from "../components/ImageCropper";
import { RichTextEditor, RichTextDisplay } from "../components/RichTextEditor";
import { 
  Send, 
  AlertCircle, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Edit, 
  Trash2, 
  HelpCircle, 
  X,
  Search,
  MapPin
} from "lucide-react";

interface Props {
  addToast: (msg: string, type: "success" | "error" | "info") => void;
}

export default function UserDashboard({ addToast }: Props) {
  const [activeTab, setActiveTab] = useState<"proposals" | "volunteering">("proposals");
  const [myProposals, setMyProposals] = useState<TaskRequest[]>([]);
  const [myApplications, setMyApplications] = useState<VolunteerApp[]>([]);
  const [myProposalsApps, setMyProposalsApps] = useState<VolunteerApp[]>([]);
  const [expandedProposals, setExpandedProposals] = useState<Record<string, boolean>>({});
  const [responseTexts, setResponseTexts] = useState<Record<string, string>>({});
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  
  // Request Action Query Modal State
  const [isQueryModalOpen, setIsQueryModalOpen] = useState(false);
  const [selectedProposalForQuery, setSelectedProposalForQuery] = useState<TaskRequest | null>(null);
  const [queryAction, setQueryAction] = useState<"edit" | "delete">("edit");
  const [queryReason, setQueryReason] = useState("");
  const [submittingQuery, setSubmittingQuery] = useState(false);

  // Edit Proposal Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedProposalForEdit, setSelectedProposalForEdit] = useState<TaskRequest | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editCategory, setEditCategory] = useState<any>("cleanup");
  const [editEventDate, setEditEventDate] = useState("");
  const [editEventTime, setEditEventTime] = useState("");
  const [editEventDuration, setEditEventDuration] = useState(1);
  const [editVolunteersNeeded, setEditVolunteersNeeded] = useState(10);
  const [editAddress, setEditAddress] = useState("");
  const [editLocality, setEditLocality] = useState("");
  const [editPincode, setEditPincode] = useState("");
  const [editShortDescription, setEditShortDescription] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editOrgName, setEditOrgName] = useState("");
  const [editOrgType, setEditOrgType] = useState("");
  const [editDesignation, setEditDesignation] = useState("");
  const [editImageUrl, setEditImageUrl] = useState("");
  const [submittingEdit, setSubmittingEdit] = useState(false);

  // Delete Confirmation Modal State
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [proposalIdToDelete, setProposalIdToDelete] = useState<string | null>(null);
  const [userDeletionReason, setUserDeletionReason] = useState("");

  // Chat Modal State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatProposal, setChatProposal] = useState<TaskRequest | null>(null);
  const [chatText, setChatText] = useState("");
  const [sendingChat, setSendingChat] = useState(false);

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

  const handleSendChatMessage = async () => {
    if (!chatProposal || !chatText.trim()) return;
    setSendingChat(true);
    try {
      const updatedMessages = await sendTaskChatMessage(
        chatProposal.id,
        "user",
        chatProposal.applicantName || "User",
        chatText.trim()
      );
      setChatProposal((prev) => prev ? { ...prev, chatMessages: updatedMessages } : null);
      setChatText("");
      loadDashboardData();
    } catch (error) {
      addToast("Failed to send message.", "error");
    } finally {
      setSendingChat(false);
    }
  };

  // Withdraw/Cancel Volunteering slot Modal State
  const [isWithdrawConfirmOpen, setIsWithdrawConfirmOpen] = useState(false);
  const [appIdToWithdraw, setAppIdToWithdraw] = useState<string | null>(null);
  const [withdrawReason, setWithdrawReason] = useState("");

  // Nominatim Autocomplete inside Edit Modal
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const currentUser = getCurrentUser();

  const loadDashboardData = () => {
    if (!currentUser) return;
    const allTasks = getTasks();
    const userTasks = allTasks.filter(
      (task) => task.email.toLowerCase().trim() === currentUser.email.toLowerCase().trim()
    );
    setMyProposals(userTasks);

    const allApps = getVolunteerApps();
    const userApps = allApps.filter(
      (app) => app.email.toLowerCase().trim() === currentUser.email.toLowerCase().trim()
    );
    setMyApplications(userApps);

    // Filter volunteer applications where taskId belongs to one of userTasks
    const userTasksIds = new Set(userTasks.map((t) => t.id));
    const proposerApps = allApps.filter((app) => userTasksIds.has(app.taskId));
    setMyProposalsApps(proposerApps);
  };

  const handleUpdateAppStatus = async (appId: string, status: any, reason?: string) => {
    try {
      updateVolunteerAppStatus(appId, status, reason);
      addToast(`Volunteer application successfully ${status === "approved" ? "approved" : "rejected"}.`, "success");
      // Force sync & refresh dashboard state
      await initStore();
      loadDashboardData();
    } catch (error) {
      addToast("Failed to update application status.", "error");
    }
  };

  const handleRejectApp = (appId: string) => {
    const reason = window.prompt("Enter rejection reason (optional):") || "";
    handleUpdateAppStatus(appId, "rejected", reason);
  };

  const toggleVolunteersExpand = (proposalId: string) => {
    setExpandedProposals((prev) => ({
      ...prev,
      [proposalId]: !prev[proposalId],
    }));
  };

  const exportCampaignVolunteers = (proposal: TaskRequest, apps: VolunteerApp[]) => {
    const headers = ["Volunteer Name", "Email", "Phone", "Application Status", "Applied Date", "Reason / Message", "Prior Experience", "Rejection Reason", "Campaign Title", "Campaign Event Date"];
    const rows = apps.map((app) => [
      app.name,
      app.email,
      app.phone,
      app.status === "approved" ? "Accepted" : app.status === "rejected" ? "Rejected" : "Pending",
      new Date(app.createdAt).toLocaleString("en-IN"),
      app.reason || "",
      app.prevExperience || "",
      app.rejectionReason || "",
      proposal.title,
      proposal.eventDate || "",
    ]);
    const csv = [headers, ...rows]
      .map((row) =>
        row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const safeTitle = proposal.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    link.href = url;
    link.download = `volunteers-${safeTitle}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    initStore().then(loadDashboardData);
  }, []);

  // Nominatim debounce for Address Search
  useEffect(() => {
    if (!editAddress || editAddress.trim().length < 3) {
      setSuggestions([]);
      return;
    }
    const delayDebounce = setTimeout(async () => {
      setLoadingSuggestions(true);
      try {
        const resp = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(editAddress.trim())}&addressdetails=1&limit=5&countrycodes=in&viewbox=76.8,28.9,77.4,28.4&bounded=1`,
          { headers: { "Accept-Language": "en" } }
        );
        const data = await resp.json();
        setSuggestions(data);
        setShowSuggestions(true);
      } catch (err) {
        console.error("Suggestions fetch failed", err);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [editAddress]);

  const handleResponseChange = (taskId: string, text: string) => {
    setResponseTexts((prev) => ({ ...prev, [taskId]: text }));
  };

  const handleSubmitResponse = async (taskId: string) => {
    const text = responseTexts[taskId]?.trim();
    if (!text) {
      addToast("Please provide the requested details.", "info");
      return;
    }

    setSubmittingId(taskId);
    try {
      await respondToTaskRequest(taskId, text);
      addToast("Information submitted successfully!", "success");
      setResponseTexts((prev) => ({ ...prev, [taskId]: "" }));
      initStore().then(loadDashboardData);
    } catch (error) {
      addToast("Failed to submit response.", "error");
    } finally {
      setSubmittingId(null);
    }
  };

  // Revision Request Handlers
  const handleOpenQueryModal = (proposal: TaskRequest) => {
    setSelectedProposalForQuery(proposal);
    setQueryAction("edit");
    setQueryReason("");
    setIsQueryModalOpen(true);
  };

  const handleQuerySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProposalForQuery) return;
    const reason = queryReason.trim();
    if (!reason) {
      addToast("Please provide a reason for this request.", "error");
      return;
    }
    setSubmittingQuery(true);
    try {
      await submitUserQuery(selectedProposalForQuery.id, queryAction, reason);
      addToast("Revision request submitted successfully!", "success");
      setIsQueryModalOpen(false);
      initStore().then(loadDashboardData);
    } catch (err: any) {
      addToast(err.message || "Failed to submit request.", "error");
    } finally {
      setSubmittingQuery(false);
    }
  };

  // Edit Proposal Handlers
  const handleOpenEditModal = (proposal: TaskRequest) => {
    setSelectedProposalForEdit(proposal);
    setEditTitle(proposal.title);
    setEditCategory(proposal.category);
    setEditEventDate(proposal.eventDate);
    setEditEventTime(proposal.eventTime || "");
    setEditEventDuration(proposal.eventDuration || 1);
    setEditVolunteersNeeded(proposal.volunteersNeeded);
    setEditAddress(proposal.address);
    setEditLocality(proposal.locality);
    setEditPincode(proposal.pincode);
    setEditShortDescription(proposal.shortDescription || "");
    setEditDescription(proposal.description);
    setEditOrgName(proposal.organizationName || "");
    setEditOrgType(proposal.organizationType || "");
    setEditDesignation(proposal.designation || "");
    setEditImageUrl(proposal.imageUrl || "");
    setIsEditModalOpen(true);
  };

  const selectSuggestion = (s: any) => {
    setEditAddress(s.display_name);
    if (s.address?.postcode) {
      setEditPincode(s.address.postcode);
    }
    setShowSuggestions(false);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProposalForEdit) return;
    const shortClean = editShortDescription.replace(/<[^>]*>/g, "").trim();
    const descClean = editDescription.replace(/<[^>]*>/g, "").trim();
    const cleanShortLen = editShortDescription.replace(/<[^>]*>/g, "").length;
    const cleanDescLen = editDescription.replace(/<[^>]*>/g, "").length;

    if (
      !editTitle.trim() ||
      !descClean ||
      !shortClean ||
      !editAddress.trim() ||
      !editLocality.trim() ||
      !editPincode.trim()
    ) {
      addToast("Please fill in all required fields.", "error");
      return;
    }
    if (cleanShortLen > 200) {
      addToast("Short description must not exceed 200 characters.", "error");
      return;
    }
    if (cleanDescLen > 1500) {
      addToast("Detailed description must not exceed 1500 characters.", "error");
      return;
    }
    if (!editPincode.trim().startsWith("11")) {
      addToast("Not a Delhi pincode. This platform only supports Delhi initiatives.", "error");
      return;
    }

    setSubmittingEdit(true);
    try {
      await editProposal(selectedProposalForEdit.id, {
        title: editTitle.trim(),
        category: editCategory,
        eventDate: editEventDate,
        eventTime: editEventTime,
        eventDuration: editEventDuration,
        volunteersNeeded: editVolunteersNeeded,
        address: editAddress.trim(),
        locality: editLocality.trim(),
        pincode: editPincode.trim(),
        shortDescription: editShortDescription.trim(),
        description: editDescription.trim(),
        organizationName: selectedProposalForEdit.applicantType === "group" ? editOrgName.trim() : undefined,
        organizationType: selectedProposalForEdit.applicantType === "group" ? editOrgType : undefined,
        designation: selectedProposalForEdit.applicantType === "group" ? editDesignation.trim() : undefined,
        imageUrl: editImageUrl,
      });
      addToast("Proposal updated successfully!", "success");
      setIsEditModalOpen(false);
      initStore().then(loadDashboardData);
    } catch (err: any) {
      addToast(err.message || "Failed to save proposal changes.", "error");
    } finally {
      setSubmittingEdit(false);
    }
  };

  const handleDeleteProposalClick = (taskId: string) => {
    setProposalIdToDelete(taskId);
    setUserDeletionReason("");
    setIsDeleteConfirmOpen(true);
  };

  const confirmDeleteProposal = async () => {
    if (!proposalIdToDelete) return;
    const reason = userDeletionReason.trim();
    if (!reason) {
      addToast("Please provide a reason for cancelling this proposal.", "error");
      return;
    }
    try {
      await deleteProposal(proposalIdToDelete, currentUser?.email, reason);
      addToast("Proposal deleted successfully.", "success");
      setIsDeleteConfirmOpen(false);
      setProposalIdToDelete(null);
      setUserDeletionReason("");
      initStore().then(loadDashboardData);
    } catch (err: any) {
      addToast(err.message || "Failed to delete proposal.", "error");
    }
  };

  const handleWithdrawClick = (appId: string) => {
    setAppIdToWithdraw(appId);
    setWithdrawReason("");
    setIsWithdrawConfirmOpen(true);
  };

  const confirmWithdrawVolunteering = async () => {
    if (!appIdToWithdraw) return;
    const reason = withdrawReason.trim();
    if (!reason) {
      addToast("Please provide a reason for cancelling your slot.", "error");
      return;
    }
    try {
      await withdrawVolunteerApp(appIdToWithdraw, reason);
      addToast("Successfully withdrew volunteering request.", "success");
      setIsWithdrawConfirmOpen(false);
      setAppIdToWithdraw(null);
      setWithdrawReason("");
      initStore().then(loadDashboardData);
    } catch (err: any) {
      addToast(err.message || "Failed to withdraw volunteering slot.", "error");
    }
  };

  const renderStatus = (status: TaskRequest["status"]) => {
    switch (status) {
      case "pending":
        return (
          <span className="tag" style={{ background: "rgba(245, 158, 11, 0.1)", color: "var(--warning)", display: "inline-flex", alignItems: "center", gap: "4px" }}>
            <Clock size={12} /> Under Review
          </span>
        );
      case "verified":
        return (
          <span className="tag" style={{ background: "rgba(93, 124, 107, 0.1)", color: "var(--accent)", display: "inline-flex", alignItems: "center", gap: "4px" }}>
            <CheckCircle size={12} /> Verified by Moderator
          </span>
        );
      case "approved":
        return (
          <span className="tag" style={{ background: "rgba(16, 185, 129, 0.1)", color: "var(--success)", display: "inline-flex", alignItems: "center", gap: "4px" }}>
            <CheckCircle size={12} /> Approved & Active
          </span>
        );
      case "rejected":
        return (
          <span className="tag" style={{ background: "rgba(239, 68, 68, 0.1)", color: "var(--danger)", display: "inline-flex", alignItems: "center", gap: "4px" }}>
            <XCircle size={12} /> Rejected
          </span>
        );
      case "completed":
        return (
          <span className="tag" style={{ background: "rgba(107, 114, 128, 0.1)", color: "var(--text-secondary)", display: "inline-flex", alignItems: "center", gap: "4px" }}>
            <CheckCircle size={12} /> Conducted / Completed
          </span>
        );
      default:
        return null;
    }
  };

  // Inline Modal styles
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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "32px", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <h1 className="page-title" style={{ marginBottom: 0 }}>
              My <span style={{ color: "var(--primary)" }}>Dashboard</span>
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", marginTop: "4px" }}>
              Track your raised proposals and view your volunteer requests
            </p>
          </div>
          <button 
            onClick={() => {
              initStore().then(() => {
                loadDashboardData();
                addToast("Dashboard refreshed", "info");
              });
            }} 
            className="btn btn-outline btn-sm"
          >
            Refresh
          </button>
        </div>

        {/* Tab switcher */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "24px" }}>
          <button
            className={`filter-chip ${activeTab === "proposals" ? "active" : ""}`}
            onClick={() => setActiveTab("proposals")}
          >
            My Proposals ({myProposals.length})
          </button>
          <button
            className={`filter-chip ${activeTab === "volunteering" ? "active" : ""}`}
            onClick={() => setActiveTab("volunteering")}
          >
            Volunteer Requests ({myApplications.length})
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {activeTab === "proposals" ? (
            myProposals.length === 0 ? (
              <div className="card" style={{ padding: "48px 20px", textAlign: "center", border: "1px dashed var(--border)" }}>
                <h3 style={{ marginBottom: "8px" }}>No Proposals Raised Yet</h3>
                <p style={{ color: "var(--text-secondary)", marginBottom: "20px", fontSize: "0.92rem" }}>
                  Got an idea to make Delhi better? Submit an initiative today!
                </p>
                <Link to="/submit" className="btn btn-primary" style={{ display: "inline-block", textDecoration: "none" }}>
                  Raise a Proposal
                </Link>
              </div>
            ) : (
              myProposals.map((proposal) => {
                const cat = CATEGORY_META[proposal.category];
                const chatMsgs = proposal.chatMessages || [];
                const lastChatMsg = chatMsgs.length > 0 ? chatMsgs[chatMsgs.length - 1] : null;
                const lastMsgIsMod = lastChatMsg ? lastChatMsg.sender === "moderator" : false;
                const hasPendingModQuery = lastMsgIsMod || (!!proposal.moderatorRequest && !proposal.userResponse);

                return (
                  <div key={proposal.id} className="card" style={{ padding: "28px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px", marginBottom: "16px" }}>
                      <div>
                        <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap", marginBottom: "8px" }}>
                          <span className="tag" style={{ background: cat.color + "15", color: cat.color }}>
                            {cat.emoji} {cat.label}
                          </span>
                          {renderStatus(proposal.status)}
                        </div>
                        <h3 style={{ color: "var(--text)", fontWeight: 700, margin: 0 }}>{proposal.title}</h3>
                      </div>
                      <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                        Raised on: {new Date(proposal.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>

                    <div style={{ fontSize: "0.92rem", color: "var(--text-secondary)", lineHeight: "1.6", marginBottom: "20px" }}>
                      <RichTextDisplay content={proposal.shortDescription || proposal.description} />
                    </div>

                    <div 
                      style={{ 
                        display: "grid", 
                        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
                        gap: "10px", 
                        background: "rgba(0,0,0,0.01)", 
                        padding: "12px", 
                        borderRadius: "10px", 
                        marginBottom: "20px",
                        border: "1px solid var(--border-light)",
                        fontSize: "0.8rem"
                      }}
                    >
                      <div>
                        <strong style={{ color: "var(--text-secondary)" }}>Locality:</strong> {proposal.locality} ({proposal.pincode})
                      </div>
                      <div>
                        <strong style={{ color: "var(--text-secondary)" }}>{proposal.status === "completed" ? "Date & Time:" : "Proposed Date & Time:"}</strong> {proposal.eventDate} {proposal.eventTime ? `at ${proposal.eventTime}` : ''}
                      </div>
                      <div>
                        <strong style={{ color: "var(--text-secondary)" }}>Volunteers:</strong> {proposal.volunteersNeeded}
                      </div>
                    </div>

                    {/* Proposal Rejection Warning */}
                    {proposal.status === "rejected" && (
                      <div style={{ border: "1px solid rgba(239, 68, 68, 0.2)", background: "rgba(239, 68, 68, 0.02)", borderRadius: "12px", padding: "16px", marginBottom: "20px" }}>
                        <div style={{ display: "flex", gap: "8px", alignItems: "center", color: "var(--danger)", fontWeight: 700, fontSize: "0.85rem" }}>
                          <AlertCircle size={16} /> Proposal Declined / Rejected
                        </div>
                        <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "6px", margin: 0 }}>
                          Unfortunately, this initiative proposal was declined by our review team.
                        </p>
                        {proposal.rejectionReason && (
                          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "4px", margin: 0 }}>
                            <strong>Reason:</strong> {proposal.rejectionReason}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Active Revision Request Warning */}
                    {proposal.userQueryStatus === "pending" && (
                      <div style={{ border: "1px solid rgba(245, 158, 11, 0.2)", background: "rgba(245, 158, 11, 0.02)", borderRadius: "12px", padding: "16px", marginBottom: "20px" }}>
                        <div style={{ display: "flex", gap: "8px", alignItems: "center", color: "var(--warning)", fontWeight: 700, fontSize: "0.85rem" }}>
                          <Clock size={16} /> Pending Revision Request
                        </div>
                        <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "4px", margin: 0 }}>
                          You requested a <strong>{proposal.userQueryAction === "delete" ? "Cancellation / Deletion" : "Details Edit"}</strong> for this proposal.
                        </p>
                        <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "2px", margin: 0 }}>
                          <strong>Reason:</strong> {proposal.userQueryReason}
                        </p>
                      </div>
                    )}

                    {/* Revision Allowed Success Notification */}
                    {proposal.allowUserEdit && (
                      <div style={{ border: "1px solid rgba(16, 185, 129, 0.2)", background: "rgba(16, 185, 129, 0.02)", borderRadius: "12px", padding: "16px", marginBottom: "20px" }}>
                        <div style={{ display: "flex", gap: "8px", alignItems: "center", color: "var(--success)", fontWeight: 700, fontSize: "0.85rem" }}>
                          <CheckCircle size={16} /> Edit Permission Granted
                        </div>
                        <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "4px", margin: 0 }}>
                          An admin/moderator has authorized you to update this proposal. Click <strong>Edit Proposal</strong> below to apply revisions.
                        </p>
                      </div>
                    )}

                    {/* Proposer Revision Action Buttons */}
                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "20px" }}>
                      {proposal.status !== "completed" && (proposal.status === "pending" || proposal.allowUserEdit) && (
                        <button
                          onClick={() => handleOpenEditModal(proposal)}
                          className="btn btn-secondary btn-sm"
                          style={{ borderColor: "var(--primary)", color: "var(--primary)", display: "inline-flex", alignItems: "center", gap: "6px" }}
                        >
                          <Edit size={14} /> Edit Proposal
                        </button>
                      )}
                      {proposal.status === "pending" && (
                        <button
                          onClick={() => handleDeleteProposalClick(proposal.id)}
                          className="btn btn-sm"
                          style={{ background: "rgba(239, 68, 68, 0.08)", color: "var(--danger)", border: "1px solid rgba(239, 68, 68, 0.2)", display: "inline-flex", alignItems: "center", gap: "6px" }}
                        >
                          <Trash2 size={14} /> Cancel Proposal
                        </button>
                      )}
                      {proposal.status !== "pending" && proposal.status !== "completed" && !proposal.allowUserEdit && proposal.userQueryStatus !== "pending" && (
                        <button
                          onClick={() => handleOpenQueryModal(proposal)}
                          className="btn btn-primary btn-sm"
                          style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                        >
                          <HelpCircle size={14} /> Request Revision/Cancellation
                        </button>
                      )}
                      {proposal.status !== "completed" && (proposal.status === "pending" || proposal.status === "verified" || proposal.moderatorRequest) && (
                        <button
                          onClick={() => { setChatProposal(proposal); setIsChatOpen(true); }}
                          className="btn btn-outline btn-sm"
                          style={{ color: "var(--primary)", borderColor: "var(--primary)", display: "inline-flex", alignItems: "center", gap: "6px" }}
                        >
                          💬 Chat with Moderator
                        </button>
                      )}
                    </div>

                    {/* Volunteer Management Section (Only for approved/live campaigns) */}
                    {proposal.status === "approved" && (
                      (() => {
                        const proposalApps = myProposalsApps.filter((app) => app.taskId === proposal.id);
                        const pendingApps = proposalApps.filter((app) => app.status === "applied");
                        const isExpanded = !!expandedProposals[proposal.id];
                        
                        return (
                          <div style={{ marginTop: "16px", borderTop: "1px solid var(--border-light)", paddingTop: "16px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                              <button
                                type="button"
                                onClick={() => toggleVolunteersExpand(proposal.id)}
                                className="btn btn-outline btn-sm"
                                style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--primary)", borderColor: "var(--primary)" }}
                              >
                                👥 {isExpanded ? "Hide" : "Manage"} Volunteer Applications ({pendingApps.length} pending, {proposalApps.length} total)
                              </button>
                              
                              {proposalApps.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => exportCampaignVolunteers(proposal, proposalApps)}
                                  className="btn btn-secondary btn-sm"
                                  style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                                >
                                  📥 Export Volunteers CSV
                                </button>
                              )}
                            </div>

                            {isExpanded && (
                              <div style={{ marginTop: "16px" }}>
                                {proposalApps.length === 0 ? (
                                  <div style={{ padding: "16px", textAlign: "center", background: "rgba(0,0,0,0.01)", borderRadius: "8px", border: "1px dashed var(--border)", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                                    No volunteers have applied to this initiative yet.
                                  </div>
                                ) : (
                                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                    {proposalApps.map((app) => (
                                      <div key={app.id} style={{ padding: "16px", background: "var(--bg-card)", border: "1.5px solid var(--border)", borderRadius: "10px", display: "flex", flexDirection: "column", gap: "8px" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                                          <div>
                                            <h4 style={{ margin: 0, fontWeight: 700, fontSize: "0.95rem" }}>{app.name}</h4>
                                            <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                                              {app.email} • {app.phone} • Applied on {new Date(app.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                            </span>
                                          </div>
                                          <div>
                                            <span className={`status-badge status-${app.status}`} style={{ fontSize: "0.72rem", padding: "4px 8px" }}>
                                              {app.status === "approved" ? "Accepted" : app.status === "rejected" ? "Rejected" : "Pending"}
                                            </span>
                                          </div>
                                        </div>

                                        <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "4px" }}>
                                          <strong>Reason for joining:</strong> {app.reason}
                                        </div>

                                        {app.prevExperience && (
                                          <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)", background: "rgba(0,0,0,0.02)", padding: "8px 12px", borderRadius: "6px", borderLeft: "3px solid var(--primary)" }}>
                                            <strong>Prior Experience:</strong> {app.prevExperience}
                                          </div>
                                        )}

                                        {app.status === "rejected" && app.rejectionReason && (
                                          <div style={{ fontSize: "0.82rem", color: "var(--danger)", background: "rgba(239, 68, 68, 0.02)", padding: "6px 12px", borderRadius: "6px", borderLeft: "3px solid var(--danger)" }}>
                                            <strong>Rejection Reason:</strong> {app.rejectionReason}
                                          </div>
                                        )}

                                        {app.status === "applied" && (
                                          <div style={{ display: "flex", gap: "8px", marginTop: "4px", justifyContent: "flex-end" }}>
                                            <button
                                              type="button"
                                              onClick={() => handleUpdateAppStatus(app.id, "approved")}
                                              className="btn btn-success btn-sm"
                                              style={{ padding: "4px 10px", fontSize: "0.75rem" }}
                                            >
                                              Accept
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => handleRejectApp(app.id)}
                                              className="btn btn-danger btn-sm"
                                              style={{ padding: "4px 10px", fontSize: "0.75rem" }}
                                            >
                                              Reject
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })()
                    )}

                    {/* Moderator Request/Chat pop warning card */}
                    {hasPendingModQuery && (
                      <div 
                        style={{ 
                          border: "1px solid rgba(245, 158, 11, 0.25)", 
                          background: "rgba(245, 158, 11, 0.04)", 
                          borderRadius: "12px", 
                          padding: "16px",
                          marginTop: "16px",
                          boxShadow: "0 2px 4px rgba(245, 158, 11, 0.05)"
                        }}
                      >
                        <div style={{ display: "flex", gap: "8px", alignItems: "center", color: "var(--warning)", fontWeight: 700, fontSize: "0.88rem", marginBottom: "8px" }}>
                          <AlertCircle size={18} /> Action Required: Moderator Requesting Details
                        </div>
                        <p style={{ fontSize: "0.88rem", color: "var(--text)", fontStyle: "italic", background: "white", padding: "12px", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.03)", margin: "0 0 12px 0", lineHeight: "1.4" }}>
                          "{lastChatMsg ? lastChatMsg.text : proposal.moderatorRequest}"
                        </p>
                        <div style={{ display: "flex", justifyContent: "flex-end" }}>
                          <button
                            onClick={() => { setChatProposal(proposal); setIsChatOpen(true); }}
                            className="btn btn-primary btn-sm"
                            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                          >
                            💬 Open Chat to Reply
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )
          ) : (
            myApplications.length === 0 ? (
              <div className="card" style={{ padding: "48px 20px", textAlign: "center", border: "1px dashed var(--border)" }}>
                <h3 style={{ marginBottom: "8px" }}>No Volunteering Requests</h3>
                <p style={{ color: "var(--text-secondary)", marginBottom: "20px", fontSize: "0.92rem" }}>
                  You haven't applied to volunteer for any campaigns yet.
                </p>
                <Link to="/#success-stories" className="btn btn-primary" style={{ display: "inline-block", textDecoration: "none" }}>
                  Explore Campaigns
                </Link>
              </div>
            ) : (
              myApplications.map((app) => {
                const task = getTaskById(app.taskId);
                return (
                  <div key={app.id} className="card" style={{ padding: "24px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px", marginBottom: "16px" }}>
                      <div>
                        <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "4px" }}>
                          <span className="tag" style={{ background: "rgba(140, 36, 36, 0.08)", color: "var(--primary)" }}>
                            Volunteer Application
                          </span>
                          <span className={`tag ${app.status === 'approved' ? 'tag-success' : app.status === 'rejected' ? 'tag-danger' : 'tag-warning'}`}>
                            {app.status === 'approved' ? 'Accepted' : app.status === 'rejected' ? 'Declined' : 'Pending Review'}
                          </span>
                        </div>
                        <h3 style={{ color: "var(--text)", fontWeight: 700, margin: 0 }}>
                          {task ? task.title : "Unknown Initiative"}
                        </h3>
                      </div>
                      <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                        Applied on: {new Date(app.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>

                    {task && (
                      <div 
                        style={{ 
                          display: "grid", 
                          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
                          gap: "10px", 
                          background: "rgba(0,0,0,0.01)", 
                          padding: "12px", 
                          borderRadius: "10px", 
                          marginBottom: "16px",
                          border: "1px solid var(--border-light)",
                          fontSize: "0.8rem"
                        }}
                      >
                        <div>
                          <strong style={{ color: "var(--text-secondary)" }}>Locality:</strong> {task.locality} ({task.pincode})
                        </div>
                        <div>
                          <strong style={{ color: "var(--text-secondary)" }}>Date & Time:</strong> {task.eventDate} {task.eventTime ? `at ${task.eventTime}` : ''}
                        </div>
                      </div>
                    )}

                    <div style={{ background: "var(--bg-warm)", padding: "16px", borderRadius: "12px", fontSize: "0.9rem", border: "1px solid var(--border-light)" }}>
                      <div style={{ marginBottom: "8px" }}>
                        <strong style={{ color: "var(--text-secondary)", fontSize: "0.82rem", display: "block" }}>Contact Submitted:</strong>
                        <span>Phone: {app.phone}</span>
                      </div>
                      <div style={{ marginBottom: "8px" }}>
                        <strong style={{ color: "var(--text-secondary)", fontSize: "0.82rem", display: "block" }}>Reason / Message:</strong>
                        <span style={{ fontStyle: "italic" }}>"{app.reason}"</span>
                      </div>
                      {app.prevExperience && (
                        <div>
                          <strong style={{ color: "var(--text-secondary)", fontSize: "0.82rem", display: "block" }}>Previous Volunteering Experience:</strong>
                          <span>{app.prevExperience}</span>
                        </div>
                      )}
                      {app.status === "rejected" && app.rejectionReason && (
                        <div style={{ marginTop: "12px", padding: "10px 14px", background: "rgba(239, 68, 68, 0.03)", border: "1px solid rgba(239, 68, 68, 0.15)", borderRadius: "8px", color: "var(--danger)", fontSize: "0.85rem" }}>
                          <strong>Reason for Decline:</strong> "{app.rejectionReason}"
                        </div>
                      )}
                    </div>

                    {(app.status === "applied" || app.status === "approved" || app.status === "interviewing") && (
                      <div style={{ marginTop: "16px", display: "flex", justifyContent: "flex-end" }}>
                        <button
                          type="button"
                          onClick={() => handleWithdrawClick(app.id)}
                          className="btn btn-sm"
                          style={{
                            background: "rgba(239, 68, 68, 0.08)",
                            color: "var(--danger)",
                            border: "1px solid rgba(239, 68, 68, 0.2)",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px"
                          }}
                        >
                          Cancel Volunteering Slot
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )
          )}
        </div>
      </div>

      {/* REQUEST REVISION MODAL OVERLAY */}
      {isQueryModalOpen && selectedProposalForQuery && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ fontSize: "1.3rem", fontWeight: 700, color: "var(--text)", margin: 0 }}>
                Request Revision or Cancellation
              </h2>
              <button 
                onClick={() => setIsQueryModalOpen(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "20px" }}>
              This proposal has already been verified/approved. To make edits or cancel it, submit an action request with your reason. An admin/moderator will review and process your query.
            </p>

            <form onSubmit={handleQuerySubmit}>
              <div className="form-group" style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "8px" }}>
                  Action Requested <span className="required">*</span>
                </label>
                <div style={{ display: "flex", gap: "16px" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.9rem", cursor: "pointer" }}>
                    <input 
                      type="radio" 
                      name="queryAction" 
                      value="edit" 
                      checked={queryAction === "edit"} 
                      onChange={() => setQueryAction("edit")} 
                    />
                    Request to Edit Details
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.9rem", cursor: "pointer" }}>
                    <input 
                      type="radio" 
                      name="queryAction" 
                      value="delete" 
                      checked={queryAction === "delete"} 
                      onChange={() => setQueryAction("delete")} 
                    />
                    Request to Cancel / Delete
                  </label>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: "24px" }}>
                <label htmlFor="queryReason" style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
                  Reason for Request <span className="required">*</span>
                </label>
                <textarea
                  id="queryReason"
                  required
                  rows={4}
                  placeholder="Explain why you want to edit or cancel this proposal..."
                  value={queryReason}
                  onChange={(e) => setQueryReason(e.target.value)}
                  style={{
                    width: "100%",
                    borderRadius: "8px",
                    border: "1px solid var(--border)",
                    padding: "12px",
                    fontSize: "0.9rem",
                    fontFamily: "inherit",
                    resize: "vertical"
                  }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                <button 
                  type="button" 
                  onClick={() => setIsQueryModalOpen(false)}
                  className="btn btn-secondary btn-sm"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={submittingQuery}
                  className="btn btn-primary btn-sm"
                >
                  {submittingQuery ? "Submitting..." : "Submit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT PROPOSAL MODAL OVERLAY */}
      {isEditModalOpen && selectedProposalForEdit && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ fontSize: "1.3rem", fontWeight: 700, color: "var(--text)", margin: 0 }}>
                Edit Initiative Proposal
              </h2>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit}>
              {selectedProposalForEdit.applicantType === "group" && (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                    <div className="form-group">
                      <label htmlFor="editOrgName" style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
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
                      <label htmlFor="editOrgType" style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
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
                    <label htmlFor="editDesignation" style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
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
                <label htmlFor="editTitle" style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
                  Title <span className="required">*</span>
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

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                <div className="form-group">
                  <label htmlFor="editCategory" style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
                    Category <span className="required">*</span>
                  </label>
                  <select
                    id="editCategory"
                    required
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", background: "white" }}
                  >
                    {Object.entries(CATEGORY_META).map(([k, v]) => (
                      <option key={k} value={k}>{v.emoji} {v.label}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="editEventDuration" style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
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
                  <label htmlFor="editVolunteersNeeded" style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
                    Volunteers Needed <span className="required">*</span>
                  </label>
                  <input
                    type="number"
                    id="editVolunteersNeeded"
                    required
                    min="1"
                    value={editVolunteersNeeded}
                    onKeyPress={(e) => {
                      if (!/[0-9]/.test(e.key)) {
                        e.preventDefault();
                      }
                    }}
                    onChange={(e) => setEditVolunteersNeeded(parseInt(e.target.value) || 1)}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                <div className="form-group">
                  <label htmlFor="editEventDate" style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
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
                  <label htmlFor="editEventTime" style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
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

              {/* Autocomplete address search */}
              <div className="form-group location-search-container" style={{ position: "relative", marginBottom: "16px" }}>
                <label htmlFor="editAddress" style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "4px" }}>
                  Full Address / Location Search <span className="required">*</span>
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type="text"
                    id="editAddress"
                    required
                    placeholder="Search building, street, or area in Delhi..."
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                    onFocus={() => setShowSuggestions(true)}
                    autoComplete="off"
                    style={{ width: "100%", padding: "10px 10px 10px 36px", borderRadius: "8px", border: "1px solid var(--border)" }}
                  />
                  <Search
                    size={16}
                    style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }}
                  />
                  {loadingSuggestions && (
                    <span style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      Searching...
                    </span>
                  )}
                </div>

                {/* Suggestions Dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                  <div
                    style={{
                      position: "absolute",
                      top: "100%",
                      left: 0,
                      right: 0,
                      background: "var(--bg-card)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      boxShadow: "var(--shadow-lg)",
                      zIndex: 1100,
                      marginTop: "4px",
                      maxHeight: "200px",
                      overflowY: "auto"
                    }}
                  >
                    {suggestions.map((s, idx) => (
                      <div
                        key={idx}
                        onClick={() => selectSuggestion(s)}
                        style={{
                          padding: "10px 12px",
                          cursor: "pointer",
                          borderBottom: idx === suggestions.length - 1 ? "none" : "1px solid var(--border-light)",
                          fontSize: "0.85rem",
                          display: "flex",
                          gap: "8px",
                          alignItems: "center"
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-warm)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "var(--bg-card)")}
                      >
                        <MapPin size={14} style={{ color: "var(--primary)" }} />
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {s.display_name}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "16px", marginBottom: "16px" }}>
                <div className="form-group">
                  <label htmlFor="editLocality" style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
                    Locality <span className="required">*</span>
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
                  <label htmlFor="editPincode" style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
                    Pincode <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="editPincode"
                    required
                    maxLength={6}
                    onKeyPress={(e) => {
                      if (!/[0-9]/.test(e.key)) {
                        e.preventDefault();
                      }
                    }}
                    value={editPincode}
                    onChange={(e) => setEditPincode(e.target.value)}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)" }}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: "16px" }}>
                <label htmlFor="editShortDesc" style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
                  Short Description <span className="required">*</span>
                </label>
                <RichTextEditor
                  id="editShortDesc"
                  value={editShortDescription}
                  onChange={setEditShortDescription}
                  maxLength={200}
                  placeholder="A brief tagline of your initiative (max 200 characters)"
                  rows={2}
                />
              </div>

              <div className="form-group" style={{ marginBottom: "24px" }}>
                <label htmlFor="editDesc" style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
                  Detailed Description <span className="required">*</span>
                </label>
                <RichTextEditor
                  id="editDesc"
                  value={editDescription}
                  onChange={setEditDescription}
                  maxLength={1500}
                  placeholder="Explain the what, where, and why of your initiative (max 1500 characters)"
                  rows={5}
                />
              </div>

              <div className="form-group" style={{ marginBottom: "24px" }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
                  Initiative Image / Cover Photo
                </label>
                <ImageCropper
                  initialImageUrl={editImageUrl}
                  onCropComplete={setEditImageUrl}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                <button 
                  type="button" 
                  onClick={() => setIsEditModalOpen(false)}
                  className="btn btn-secondary btn-sm"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={submittingEdit}
                  className="btn btn-primary btn-sm"
                >
                  {submittingEdit ? "Saving..." : "Submit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL OVERLAY */}
      {isDeleteConfirmOpen && (
        <div style={modalOverlayStyle}>
          <div style={{ ...modalContentStyle, maxWidth: "460px", padding: "28px" }}>
            <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "16px" }}>
              <div style={{ color: "var(--danger)", display: "flex", alignItems: "center" }}>
                <Trash2 size={24} />
              </div>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text)", margin: 0 }}>
                Cancel & Delete Proposal?
              </h3>
            </div>
            <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", marginBottom: "16px", lineHeight: "1.5" }}>
              Are you sure you want to cancel and delete this proposal? This will archive your proposal data permanently. Please provide a reason for cancellation:
            </p>
            <div style={{ marginBottom: "20px" }}>
              <textarea
                required
                rows={3}
                value={userDeletionReason}
                onChange={(e) => setUserDeletionReason(e.target.value)}
                placeholder="e.g., Change of plans / Conflict in schedule..."
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
                  setIsDeleteConfirmOpen(false);
                  setProposalIdToDelete(null);
                  setUserDeletionReason("");
                }}
                className="btn btn-secondary btn-sm"
              >
                Go Back
              </button>
              <button
                type="button"
                onClick={confirmDeleteProposal}
                className="btn btn-sm"
                style={{ background: "var(--danger)", color: "white" }}
              >
                Cancel Proposal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VOLUNTEER SLOT WITHDRAWAL CONFIRMATION MODAL OVERLAY */}
      {isWithdrawConfirmOpen && (
        <div style={modalOverlayStyle}>
          <div style={{ ...modalContentStyle, maxWidth: "460px", padding: "28px" }}>
            <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "16px" }}>
              <div style={{ color: "var(--danger)", display: "flex", alignItems: "center" }}>
                <Trash2 size={24} />
              </div>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text)", margin: 0 }}>
                Cancel Volunteering Slot?
              </h3>
            </div>
            <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", marginBottom: "16px", lineHeight: "1.5" }}>
              Are you sure you want to withdraw your request and cancel your volunteering slot for this campaign? Please provide a reason for withdrawal:
            </p>
            <div style={{ marginBottom: "20px" }}>
              <textarea
                required
                rows={3}
                value={withdrawReason}
                onChange={(e) => setWithdrawReason(e.target.value)}
                placeholder="e.g., Unforeseen personal emergency / Conflict in schedule..."
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
                  setIsWithdrawConfirmOpen(false);
                  setAppIdToWithdraw(null);
                  setWithdrawReason("");
                }}
                className="btn btn-secondary btn-sm"
              >
                Go Back
              </button>
              <button
                type="button"
                onClick={confirmWithdrawVolunteering}
                className="btn btn-sm"
                style={{ background: "var(--danger)", color: "white" }}
              >
                Cancel Slot
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chat Dialog Modal Overlay */}
      {isChatOpen && chatProposal && (
        <div className="modal-overlay" onClick={() => { setIsChatOpen(false); setChatProposal(null); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "600px", width: "95%", padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div>
                <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--primary)", margin: 0 }}>
                  💬 Discussion: {chatProposal.title}
                </h3>
                <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                  Discussing proposal with Antigravity Moderator
                </span>
              </div>
              <button
                onClick={() => { setIsChatOpen(false); setChatProposal(null); }}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.25rem", color: "var(--text-muted)" }}
              >
                ✕
              </button>
            </div>

            {/* Chat Messages Log */}
            <div 
              style={{ 
                maxHeight: "300px", 
                overflowY: "auto", 
                background: "rgba(0,0,0,0.01)", 
                border: "1px solid var(--border-light)", 
                borderRadius: "12px", 
                padding: "16px", 
                display: "flex", 
                flexDirection: "column", 
                gap: "12px",
                marginBottom: "16px"
              }}
            >
              {getTaskMessages(chatProposal).length === 0 ? (
                <div style={{ padding: "30px", textAlign: "center", color: "var(--text-muted)", fontSize: "0.88rem" }}>
                  No messages yet. Send a message to start discussion with the moderator.
                </div>
              ) : (
                getTaskMessages(chatProposal).map((msg: any) => {
                  const isMod = msg.sender === "moderator";
                  return (
                    <div 
                      key={msg.id} 
                      style={{ 
                        display: "flex", 
                        flexDirection: "column", 
                        alignSelf: isMod ? "flex-start" : "flex-end",
                        maxWidth: "80%"
                      }}
                    >
                      <div style={{ 
                        fontSize: "0.75rem", 
                        color: "var(--text-secondary)", 
                        marginBottom: "3px", 
                        alignSelf: isMod ? "flex-start" : "flex-end",
                        fontWeight: 600
                      }}>
                        {msg.senderName}
                      </div>
                      <div 
                        style={{ 
                          padding: "10px 14px", 
                          borderRadius: "14px", 
                          borderTopLeftRadius: isMod ? "2px" : "14px",
                          borderTopRightRadius: !isMod ? "2px" : "14px",
                          background: isMod ? "white" : "var(--primary)", 
                          color: isMod ? "var(--text)" : "white",
                          fontSize: "0.88rem",
                          lineHeight: "1.4",
                          border: isMod ? "1px solid var(--border)" : "none",
                          boxShadow: "0 1px 2px rgba(0,0,0,0.02)"
                        }}
                      >
                        {msg.text}
                      </div>
                      <div style={{ 
                        fontSize: "0.7rem", 
                        color: "var(--text-muted)", 
                        marginTop: "3px", 
                        alignSelf: isMod ? "flex-start" : "flex-end" 
                      }}>
                        {new Date(msg.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Chat Send Form */}
            <div style={{ display: "flex", gap: "8px" }}>
              <input
                type="text"
                placeholder="Type a message to reply to the moderator..."
                value={chatText}
                onChange={(e) => setChatText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSendChatMessage();
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
                onClick={handleSendChatMessage}
                disabled={sendingChat || !chatText.trim()}
                className="btn btn-primary"
                style={{ height: "40px", padding: "0 18px", whiteSpace: "nowrap" }}
              >
                {sendingChat ? "Sending..." : "Send"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

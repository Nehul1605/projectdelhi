import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getTaskById, getTaskBySlug, slugify, addVolunteerApp, getCurrentUser, registerGeneralPartner, getFeaturedTasks, getApprovedTasks } from '../store';
import { CATEGORY_META } from '../types';
import { Share2, Copy, X } from 'lucide-react';
import QRCode from 'qrcode';

interface Props {
  addToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export default function TaskDetail({ addToast }: Props) {
  const { slug, id } = useParams<{ slug?: string; id?: string }>();
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const [showModal, setShowModal] = useState(false);
  const [showPartnerModal, setShowPartnerModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const modalOpenedAt = useRef<number>(0);
  const [partnerForm, setPartnerForm] = useState({
    orgName: "",
    orgType: "",
    contactName: "",
    designation: "",
    email: "",
    phone: "",
    collabReason: "",
    location: "",
  });
  const [partnerSubmitting, setPartnerSubmitting] = useState(false);
  const [task, setTask] = useState(() => {
    if (slug) {
      return getTaskBySlug(slug) || getTaskById(slug);
    }
    return getTaskById(id || '');
  });

  useEffect(() => {
    if (slug) {
      setTask(getTaskBySlug(slug) || getTaskById(slug));
    } else if (id) {
      setTask(getTaskById(id));
    }
  }, [slug, id]);

  const lastToastTaskId = useRef<string | null>(null);

  useEffect(() => {
    if (task && task.volunteers.length >= task.volunteersNeeded && lastToastTaskId.current !== task.id) {
      lastToastTaskId.current = task.id;
      addToast("For this event volunteer slots occupied. You can volunteer for other events those are live currently as has spot left.", "info");
    }
  }, [task, addToast]);

  useEffect(() => {
    if (currentUser) {
      setPartnerForm((prev) => ({
        ...prev,
        contactName: currentUser.name || "",
        email: currentUser.email || "",
      }));
    }
  }, [currentUser]);

  const getEventUrl = () => {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return `https://projectdelhi.org${window.location.pathname}`;
    }
    return window.location.href;
  };

  useEffect(() => {
    if (showShareModal) {
      modalOpenedAt.current = Date.now();
      QRCode.toDataURL(getEventUrl(), { margin: 1, width: 180 })
        .then(url => setQrCodeUrl(url))
        .catch(err => console.error("Error generating QR code preview", err));
    }
  }, [showShareModal]);

  if (!task) {
    return (
      <div className="container page-section">
        <div className="empty-state">
          <h3>Task not found</h3>
          <p>This initiative may have been removed or doesn't exist.</p>
          <Link to="/initiatives" className="btn btn-primary" style={{ marginTop: 16 }}>Browse Initiatives</Link>
        </div>
      </div>
    );
  }

  const cat = CATEGORY_META[task.category];
  const progress = Math.min((task.volunteers.length / task.volunteersNeeded) * 100, 100);
  const eventDate = new Date(task.eventDate).toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
  const featuredTask = getFeaturedTasks().find((t) => t.id !== task.id);

  const avatarColors = ['#8c2424', '#5d7c6b', '#10B981', '#8B5CF6', '#EC4899', '#F59E0B'];

  const handleVolunteer = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = (fd.get('name') as string).trim();
    const email = (fd.get('email') as string).trim();
    const phone = (fd.get('phone') as string).trim();
    const message = (fd.get('message') as string).trim();
    const prevExperience = (fd.get('prevExperience') as string).trim();

    addVolunteerApp({
      taskId: task.id,
      taskTitle: task.title,
      name,
      email,
      phone,
      reason: message || "No message provided.",
      prevExperience: prevExperience || ""
    });

    addToast(`Thank you, ${name}! Your application has been sent for screening. 🎉`, 'success');
    setShowModal(false);
  };

  const handlePartnerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task) return;
    const { orgName, orgType, contactName, designation, email, phone, collabReason, location } = partnerForm;
    if (!orgName || !orgType || !contactName || !designation || !email || !phone || !collabReason || !location) {
      addToast("All fields are required", "error");
      return;
    }
    setPartnerSubmitting(true);
    const res = await registerGeneralPartner({
      ...partnerForm,
      taskId: task.id,
      taskTitle: task.title,
    });
    setPartnerSubmitting(false);
    if (res.success) {
      addToast("Partnership request submitted successfully!", "success");
      setShowPartnerModal(false);
      setPartnerForm({
        orgName: "",
        orgType: "",
        contactName: currentUser?.name || "",
        designation: "",
        email: currentUser?.email || "",
        phone: "",
        collabReason: "",
        location: "",
      });
    } else {
      addToast(res.message, "error");
    }
  };

  const downloadPoster = async () => {
    if (!task) return;

    // Guard against accidental double-clicks from parent button
    if (Date.now() - modalOpenedAt.current < 400) {
      return;
    }

    try {
      const canvas = document.createElement("canvas");
      canvas.width = 600;
      canvas.height = 800;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Draw Background Gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, 800);
      gradient.addColorStop(0, "#8c2424"); // Primary Burgundy
      gradient.addColorStop(0.5, "#4c1212"); // Dark Burgundy
      gradient.addColorStop(1, "#180a0a"); // Off-black
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 600, 800);

      // Subtle background design circles
      ctx.fillStyle = "rgba(255, 255, 255, 0.03)";
      ctx.beginPath();
      ctx.arc(100, 100, 200, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(500, 700, 250, 0, Math.PI * 2);
      ctx.fill();

      // Draw Project Logo (circular with border and background)
      try {
        const logoImg = await new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = (e) => reject(e);
          img.src = `${window.location.origin}/logo.png`;
        });

        const logoX = 300;
        const logoY = 60;
        const logoRadius = 25;

        // Draw white background circle for logo
        ctx.fillStyle = "#FAF8F5";
        ctx.beginPath();
        ctx.arc(logoX, logoY, logoRadius, 0, Math.PI * 2);
        ctx.fill();

        // Draw circular logo image
        ctx.save();
        ctx.beginPath();
        ctx.arc(logoX, logoY, logoRadius - 1, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(logoImg, logoX - logoRadius, logoY - logoRadius, logoRadius * 2, logoRadius * 2);
        ctx.restore();

        // Draw elegant gold border ring
        ctx.strokeStyle = "#f59e0b"; // Gold accent
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(logoX, logoY, logoRadius, 0, Math.PI * 2);
        ctx.stroke();
      } catch (err) {
        console.warn("Failed to load logo for poster:", err);
      }

      // Top branding header
      ctx.font = "bold 14px sans-serif";
      ctx.fillStyle = "#FAF8F5";
      ctx.textAlign = "center";
      ctx.fillText("NAKSH FOUNDATION PRESENTS", 300, 105);

      ctx.font = "800 24px sans-serif";
      ctx.fillStyle = "#f59e0b"; // Gold color
      ctx.fillText("PROJECT DELHI", 300, 130);

      // Decorative line
      ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(150, 145);
      ctx.lineTo(450, 145);
      ctx.stroke();

      // Category Emoji & Tag
      const catData = CATEGORY_META[task.category] || { emoji: "🌿", label: "Campaign" };
      ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
      const badgeText = `${catData.emoji} ${catData.label.toUpperCase()}`;
      ctx.font = "bold 12px sans-serif";
      const textWidth = ctx.measureText(badgeText).width;
      
      // Draw badge rounded background manually
      const rx = 300 - (textWidth + 24) / 2;
      const ry = 160;
      const rw = textWidth + 24;
      const rh = 28;
      const radius = 14;
      ctx.beginPath();
      ctx.moveTo(rx + radius, ry);
      ctx.lineTo(rx + rw - radius, ry);
      ctx.quadraticCurveTo(rx + rw, ry, rx + rw, ry + radius);
      ctx.lineTo(rx + rw, ry + rh - radius);
      ctx.quadraticCurveTo(rx + rw, ry + rh, rx + rw - radius, ry + rh);
      ctx.lineTo(rx + radius, ry + rh);
      ctx.quadraticCurveTo(rx, ry + rh, rx, ry + rh - radius);
      ctx.lineTo(rx, ry + radius);
      ctx.quadraticCurveTo(rx, ry, rx + radius, ry);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "#FAF8F5";
      ctx.fillText(badgeText, 300, 178);

      // Event Title (multi-line handling)
      ctx.font = "800 28px sans-serif";
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      
      const words = task.title.split(" ");
      let line = "";
      let lines = [];
      const maxWidth = 500;
      const lineHeight = 36;

      for (let n = 0; n < words.length; n++) {
        let testLine = line + words[n] + " ";
        let metrics = ctx.measureText(testLine);
        let testWidth = metrics.width;
        if (testWidth > maxWidth && n > 0) {
          lines.push(line);
          line = words[n] + " ";
        } else {
          line = testLine;
        }
      }
      lines.push(line);

      let startY = 225;
      for (let i = 0; i < lines.length; i++) {
        ctx.fillText(lines[i].trim(), 300, startY + (i * lineHeight));
      }

      // Translucent Details Box
      const boxY = startY + (lines.length * lineHeight) + 15;
      ctx.fillStyle = "rgba(255, 255, 255, 0.07)";
      ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
      ctx.lineWidth = 1;
      
      const bx = 50;
      const by = boxY;
      const bw = 500;
      const bh = 200;
      const br = 16;
      ctx.beginPath();
      ctx.moveTo(bx + br, by);
      ctx.lineTo(bx + bw - br, by);
      ctx.quadraticCurveTo(bx + bw, by, bx + bw, by + br);
      ctx.lineTo(bx + bw, by + bh - br);
      ctx.quadraticCurveTo(bx + bw, by + bh, bx + bw - br, by + bh);
      ctx.lineTo(bx + br, by + bh);
      ctx.quadraticCurveTo(bx, by + bh, bx, by + bh - br);
      ctx.lineTo(bx, by + br);
      ctx.quadraticCurveTo(bx, by, bx + br, by);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Box Contents
      ctx.textAlign = "left";
      
      // Date & Time
      ctx.font = "bold 15px sans-serif";
      ctx.fillStyle = "#f59e0b"; // Gold accent
      ctx.fillText("📅 DATE & TIME", 80, boxY + 35);
      ctx.font = "500 15px sans-serif";
      ctx.fillStyle = "#ffffff";
      ctx.fillText(`${task.eventDate} ${task.eventTime ? `at ${task.eventTime}` : ''}`, 80, boxY + 60);

      // Location
      ctx.font = "bold 15px sans-serif";
      ctx.fillStyle = "#f59e0b";
      ctx.fillText("📍 LOCATION & ADDRESS", 80, boxY + 100);
      ctx.font = "500 15px sans-serif";
      ctx.fillStyle = "#ffffff";
      
      const addressLine = `${task.address}, ${task.locality}`;
      const addressWords = addressLine.split(" ");
      let addrLine = "";
      let addrLines = [];
      for (let n = 0; n < addressWords.length; n++) {
        let testL = addrLine + addressWords[n] + " ";
        let testW = ctx.measureText(testL).width;
        if (testW > 420 && n > 0) {
          addrLines.push(addrLine);
          addrLine = addressWords[n] + " ";
        } else {
          addrLine = testL;
        }
      }
      addrLines.push(addrLine);
      
      ctx.fillText(addrLines[0].trim(), 80, boxY + 125);
      if (addrLines[1]) {
        ctx.fillText(addrLines[1].trim(), 80, boxY + 150);
      }

      // Volunteers count
      ctx.font = "bold 15px sans-serif";
      ctx.fillStyle = "#f59e0b";
      ctx.fillText("👥 TARGET VOLUNTEERS", 80, boxY + 180);
      ctx.font = "500 15px sans-serif";
      ctx.fillStyle = "#ffffff";
      ctx.fillText(`${task.volunteersNeeded} volunteers needed (Join the drive!)`, 270, boxY + 180);

      // Call To Action Footer
      ctx.textAlign = "center";
      ctx.font = "bold 14px sans-serif";
      ctx.fillStyle = "#FAF8F5";
      ctx.fillText("Scan QR or register online to join us:", 300, boxY + 230);

      // Generate and draw QR Code
      try {
        const qrDataUrl = await QRCode.toDataURL(getEventUrl(), {
          margin: 1,
          width: 180,
          color: {
            dark: "#180a0a",
            light: "#FAF8F5"
          }
        });

        const qrImg = await new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = (e) => reject(e);
          img.src = qrDataUrl;
        });

        // Draw rounded white container for QR code
        ctx.fillStyle = "#FAF8F5";
        ctx.beginPath();
        const qrX = 255;
        const qrY = boxY + 245;
        const qrW = 90;
        const qrH = 90;
        const qrR = 10;
        ctx.moveTo(qrX + qrR, qrY);
        ctx.lineTo(qrX + qrW - qrR, qrY);
        ctx.quadraticCurveTo(qrX + qrW, qrY, qrX + qrW, qrY + qrR);
        ctx.lineTo(qrX + qrW, qrY + qrH - qrR);
        ctx.quadraticCurveTo(qrX + qrW, qrY + qrH, qrX + qrW - qrR, qrY + qrH);
        ctx.lineTo(qrX + qrR, qrY + qrH);
        ctx.quadraticCurveTo(qrX, qrY + qrH, qrX, qrY + qrH - qrR);
        ctx.lineTo(qrX, qrY + qrR);
        ctx.quadraticCurveTo(qrX, qrY, qrX + qrR, qrY);
        ctx.closePath();
        ctx.fill();

        // Draw QR code image centered inside
        ctx.drawImage(qrImg, qrX + 5, qrY + 5, qrW - 10, qrH - 10);
      } catch (err) {
        console.error("Failed to generate/draw QR Code for poster:", err);
      }
      
      ctx.font = "bold 15px sans-serif";
      ctx.fillStyle = "#f59e0b";
      const displayUrl = "projectdelhi.org" + window.location.pathname;
      ctx.fillText(displayUrl, 300, boxY + 355);

      // Save Canvas to Image
      const url = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = url;
      link.download = `${slugify(task.title)}-campaign-invite.png`;
      link.click();
      addToast("Campaign invite poster downloaded successfully! Share it on Instagram Stories or status.", "success");
    } catch (err) {
      console.error("Error generating poster:", err);
      addToast("Failed to generate poster image. Please try sharing the link directly.", "error");
    }
  };

  const handleShareClick = () => {
    const eventUrl = window.location.href;
    const title = task?.title || "Community Initiative";
    const catData = CATEGORY_META[task?.category || ''] || { label: 'Community Initiative' };

    // Professional share text with clean layout (no excessive emojis)
    const shareText = `PROJECT DELHI CAMPAIGN INVITE

Campaign Initiative: ${title}
Category: ${catData.label}
${task?.status === "approved" || task?.status === "completed" ? "Date & Time" : "Proposed Date & Time"}: ${task?.eventDate} ${task?.eventTime ? `at ${task.eventTime}` : ""}
Location: ${task?.address}, ${task?.locality}
Volunteers Needed: ${task?.volunteersNeeded}

Learn details and register here: ${eventUrl}`;

    if (navigator.share) {
      navigator.share({
        title: title,
        text: shareText,
        url: eventUrl,
      })
      .then(() => addToast("Successfully shared event!", "success"))
      .catch((error) => {
        if (error.name !== "AbortError") {
          setShowShareModal(true);
        }
      });
    } else {
      setShowShareModal(true);
    }
  };

  return (
    <div className="container page-section">
      <Link to="/initiatives" className="back-link">← Back to Initiatives</Link>

      <div className="task-detail-layout">
        <div className="task-detail-main">

        {/* Header */}
        <div className="task-detail-header">
          <div className="task-detail-tags">
            <span className="tag" style={{ background: cat.color + '15', color: cat.color }}>
              {cat.emoji} {cat.label}
            </span>
            <span className={`status-badge status-${task.status}`}>{task.status}</span>
            {task.applicantType === 'group' && (
              <span className="tag" style={{ background: '#eef4f0', color: '#5d7c6b' }}>
                Organization
              </span>
            )}
          </div>
          <h1>{task.title}</h1>
        </div>

        {/* Description */}
        <div className="card" style={{ marginBottom: 24 }}>
          {task.shortDescription && (
            <p style={{ color: 'var(--text)', fontSize: '1.05rem', fontWeight: 500, lineHeight: 1.6, marginBottom: 16 }}>
              {task.shortDescription}
            </p>
          )}
          <h3 style={{ marginBottom: 12, fontSize: '1rem' }}>About This Initiative</h3>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
            {task.description}
          </p>
        </div>

        {/* Info Grid */}
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="task-info-grid">
            <div className="info-block">
              <label>{task.status === "approved" || task.status === "completed" ? "📅 Date" : "📅 Proposed Date"}</label>
              <span>{eventDate}</span>
            </div>
            <div className="info-block">
              <label>{task.status === "approved" || task.status === "completed" ? "🕐 Time" : "🕐 Proposed Time"}</label>
              <span>{task.eventTime || "To be Decided"}</span>
            </div>
            <div className="info-block">
              <label>⏳ Duration</label>
              <span>
                {task.eventDuration ? `${task.eventDuration} ${task.eventDuration === 1 ? 'day' : 'days'}` : '1 day'}
              </span>
            </div>
            <div className="info-block">
              <label>📍 Location</label>
              <span>{task.address}</span>
            </div>
            <div className="info-block">
              <label>🏘️ Area</label>
              <span>{task.locality}, {task.city} — {task.pincode}</span>
            </div>
            <div className="info-block">
              <label>👤 Organized By</label>
              <span>
                {task.applicantName}
                {task.organizationName
                  ? ` (${task.designation ? `${task.designation}, ` : ""}${task.organizationName}${task.organizationType ? ` - ${task.organizationType}` : ""})`
                  : ""}
              </span>
            </div>
          </div>
        </div>

        {/* Volunteer Progress */}
        <div className="card" style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <h3 style={{ fontSize: '1rem' }}>Volunteer Progress</h3>
            <span style={{ fontWeight: 700, color: 'var(--primary)' }}>
              {task.volunteers.length} / {task.volunteersNeeded}
            </span>
          </div>
          <div className="progress-bar" style={{ height: 12, borderRadius: 6 }}>
            <div className="progress-fill" style={{ width: `${progress}%`, borderRadius: 6 }} />
          </div>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: 8 }}>
            {task.volunteersNeeded - task.volunteers.length > 0
              ? `${task.volunteersNeeded - task.volunteers.length} more volunteers needed!`
              : 'All volunteer spots are filled!'}
          </p>

          <div style={{ display: 'flex', gap: '12px', marginTop: 16 }}>
            <button
              className="btn btn-primary"
              style={{ flex: 1, justifyContent: 'center' }}
              onClick={() => {
                if (!currentUser) {
                  addToast("Please log in first to volunteer for events.", "info");
                  navigate("/login", { state: { from: `/initiatives/${slugify(task.title)}` } });
                  return;
                }
                setShowModal(true);
              }}
              disabled={task.volunteers.length >= task.volunteersNeeded}
            >
              Join as Volunteer
            </button>
            <button
              className="btn btn-primary"
              style={{
                flex: 1,
                justifyContent: 'center',
                background: 'var(--accent)',
                borderColor: 'var(--accent)',
                color: 'white'
              }}
              onClick={() => {
                if (!currentUser) {
                  addToast("Please log in first to partner for events.", "info");
                  navigate("/login", { state: { from: `/initiatives/${slugify(task.title)}` } });
                  return;
                }
                setShowPartnerModal(true);
              }}
            >
              Partner as Org
            </button>
          </div>
          
          <button
            className="btn btn-outline"
            style={{
              width: '100%',
              marginTop: '12px',
              justifyContent: 'center',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: 600,
              padding: '10px'
            }}
            onClick={handleShareClick}
          >
            <Share2 size={16} /> Share Event
          </button>
        </div>

        {/* Volunteer List */}
        {task.volunteers.length > 0 && (
          <div className="card">
            <h3 style={{ fontSize: '1rem', marginBottom: 8 }}>
              Volunteers ({task.volunteers.length})
            </h3>
            <div className="volunteer-list">
              {task.volunteers.map((v, i) => (
                <div key={v.id} className="volunteer-item">
                  <div
                    className="volunteer-avatar"
                    style={{ background: avatarColors[i % avatarColors.length] }}
                  >
                    {v.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="volunteer-info">
                    <div className="name">{v.name}</div>
                    {v.message && <div className="msg">"{v.message}"</div>}
                    <div className="time">
                      Joined {new Date(v.joinedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        </div>

        {featuredTask && (
          <div className="task-detail-sidebar">
            <div className="sticky-sidebar">
              <div className="phone-mockup" onClick={() => navigate(`/initiatives/${slugify(featuredTask.title)}`)}>
                <div className="dynamic-island"></div>
                <div className="phone-screen">
                  <div 
                    className="screen-wallpaper" 
                    style={{ backgroundImage: `url('${featuredTask.imageUrl || `/categories/${featuredTask.category || 'other'}.jpg`}')` }}
                  >
                    <div className="screen-wallpaper-overlay"></div>
                    <span className="priority-badge">HIGH IMPACT</span>
                  </div>
                  <div className="screen-content">
                    <div>
                      <div className="featured-label">Featured Initiative</div>
                      <h4>{featuredTask.title}</h4>
                      <div className="meta-info">
                        <div className="meta-item">
                          <span>📍</span>
                          <span>{featuredTask.locality}</span>
                        </div>
                        <div className="meta-item">
                          <span>📅</span>
                          <span>
                            {new Date(featuredTask.eventDate).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short'
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button className="phone-btn">
                      Join Campaign
                    </button>
                  </div>
                  <div className="home-indicator"></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Volunteer Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Join as Volunteer</h2>
            <p>Sign up to volunteer for <strong>{task.title}</strong></p>
            <form onSubmit={handleVolunteer}>
              <div className="form-group">
                <label htmlFor="vol-name">Your Name <span className="required">*</span></label>
                <input
                  type="text"
                  name="name"
                  id="vol-name"
                  required
                  defaultValue={currentUser?.name || ''}
                  placeholder="Your full name"
                />
              </div>
              <div className="form-group">
                <label htmlFor="vol-email">Email <span className="required">*</span></label>
                <input
                  type="email"
                  name="email"
                  id="vol-email"
                  required
                  readOnly
                  defaultValue={currentUser?.email || ''}
                  style={{ background: 'var(--bg-warm)', cursor: 'not-allowed' }}
                  placeholder="your@email.com"
                />
              </div>
              <div className="form-group">
                <label htmlFor="vol-phone">Phone <span className="required">*</span></label>
                <input
                  type="tel"
                  name="phone"
                  id="vol-phone"
                  required
                  pattern="^\+?[0-9\s\-]+$"
                  title="Please enter a valid phone number (digits, spaces, or leading +)"
                  onKeyPress={(e) => {
                    if (!/[0-9\s\-+]/.test(e.key)) {
                      e.preventDefault();
                    }
                  }}
                  placeholder="98XXXXXXXX"
                />
              </div>
              <div className="form-group">
                <label htmlFor="vol-message">Message (optional)</label>
                <textarea name="message" id="vol-message" rows={3} placeholder="Why do you want to volunteer?" />
              </div>
              <div className="form-group">
                <label htmlFor="vol-prev-exp">Previous Volunteering Experience (optional)</label>
                <textarea name="prevExperience" id="vol-prev-exp" rows={3} placeholder="Describe any previous volunteer work you have done..." />
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPartnerModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text)', margin: 0 }}>
                Partner as Organization
              </h2>
              <button 
                onClick={() => setShowPartnerModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Sign up your organization to co-host, sponsor, or provide resources for <strong>{task.title}</strong>.
            </p>
            <form onSubmit={handlePartnerSubmit}>
              <div className="form-group">
                <label htmlFor="p-orgName">Organization Name <span className="required">*</span></label>
                <input
                  type="text"
                  id="p-orgName"
                  required
                  placeholder="e.g. Naksh NGO, Delhi Youth Club"
                  value={partnerForm.orgName}
                  onChange={(e) => setPartnerForm({ ...partnerForm, orgName: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label htmlFor="p-orgType">Organization Type <span className="required">*</span></label>
                <select
                  id="p-orgType"
                  required
                  value={partnerForm.orgType}
                  onChange={(e) => setPartnerForm({ ...partnerForm, orgType: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '6px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg)',
                    color: 'var(--text)',
                    outline: 'none',
                    fontSize: '0.95rem'
                  }}
                >
                  <option value="">Select organization type</option>
                  <option value="ngo">NGO / Non-Profit</option>
                  <option value="corporate">Corporate / CSR Partner</option>
                  <option value="school">School / College Group</option>
                  <option value="club">Local Club / Association</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label htmlFor="p-contactName">Contact Person <span className="required">*</span></label>
                  <input
                    type="text"
                    id="p-contactName"
                    required
                    placeholder="Full name"
                    value={partnerForm.contactName}
                    onChange={(e) => setPartnerForm({ ...partnerForm, contactName: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="p-designation">Designation <span className="required">*</span></label>
                  <input
                    type="text"
                    id="p-designation"
                    required
                    placeholder="e.g. Secretary, Director"
                    value={partnerForm.designation}
                    onChange={(e) => setPartnerForm({ ...partnerForm, designation: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label htmlFor="p-email">Work Email <span className="required">*</span></label>
                  <input
                    type="email"
                    id="p-email"
                    required
                    placeholder="email@organization.org"
                    value={partnerForm.email}
                    onChange={(e) => setPartnerForm({ ...partnerForm, email: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="p-phone">Phone Number <span className="required">*</span></label>
                  <input
                    type="tel"
                    id="p-phone"
                    required
                    pattern="[0-9]{10}"
                    maxLength={10}
                    onKeyPress={(e) => {
                      if (!/[0-9]/.test(e.key)) {
                        e.preventDefault();
                      }
                    }}
                    placeholder="Contact phone number"
                    value={partnerForm.phone}
                    onChange={(e) => setPartnerForm({ ...partnerForm, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="p-location">Operational Locality / HQ <span className="required">*</span></label>
                <input
                  type="text"
                  id="p-location"
                  required
                  placeholder="e.g. Dwarka, South Delhi, All Delhi"
                  value={partnerForm.location}
                  onChange={(e) => setPartnerForm({ ...partnerForm, location: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label htmlFor="p-reason">Collaboration Reason & Objectives <span className="required">*</span></label>
                <textarea
                  id="p-reason"
                  required
                  rows={3}
                  placeholder="Describe your organization's interest and resources for this specific event..."
                  value={partnerForm.collabReason}
                  onChange={(e) => setPartnerForm({ ...partnerForm, collabReason: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '6px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg)',
                    color: 'var(--text)',
                    outline: 'none',
                    fontFamily: 'inherit',
                    fontSize: '0.95rem'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: '24px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ flex: 1, justifyContent: 'center' }}
                  onClick={() => setShowPartnerModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{
                    flex: 1,
                    justifyContent: 'center',
                  }}
                  disabled={partnerSubmitting}
                >
                  {partnerSubmitting ? "Submitting..." : "Submit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showShareModal && task && (() => {
        const catData = cat || { emoji: "🌿", label: "Campaign" };
        const shareText = `PROJECT DELHI CAMPAIGN INVITE

Campaign Initiative: ${task.title}
Category: ${catData.label}
${task.status === "approved" || task.status === "completed" ? "Date & Time" : "Proposed Date & Time"}: ${task.eventDate} ${task.eventTime ? `at ${task.eventTime}` : ""}
Location: ${task.address}, ${task.locality}
Volunteers Needed: ${task.volunteersNeeded}

Learn details and register here: ${window.location.href}`;

        return (
          <div className="modal-overlay" style={{ zIndex: 1100 }}>
            <div className="modal-content" style={{ maxWidth: '740px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text)', margin: 0 }}>
                  Share Event
                </h3>
                <button 
                  onClick={() => setShowShareModal(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  <X size={20} />
                </button>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '28px' }}>
                {/* Left Column: Poster Generator & Preview */}
                <div style={{ flex: '1 1 270px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', maxWidth: '100%' }}>
                  <div 
                    style={{
                      width: '100%',
                      maxWidth: '270px',
                      aspectRatio: '3 / 4',
                      background: 'linear-gradient(180deg, #8c2424 0%, #4c1212 50%, #180a0a 100%)',
                      borderRadius: '12px',
                      padding: '20px',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      color: 'white',
                      fontFamily: 'sans-serif',
                      position: 'relative',
                      overflow: 'hidden',
                      border: '1px solid rgba(255,255,255,0.1)'
                    }}
                  >
                    {/* Subtle design element */}
                    <div style={{ position: 'absolute', top: '-50px', left: '-50px', width: '150px', height: '150px', borderRadius: '50%', background: 'rgba(255,255,255,0.02)' }} />
                    
                    {/* Top Branding */}
                    <div style={{ textAlign: 'center', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#FAF8F5', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid #f59e0b', marginBottom: '4px', overflow: 'hidden' }}>
                        <img src="/logo.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      </div>
                      <div style={{ fontSize: '0.52rem', fontWeight: 600, letterSpacing: '1px', opacity: 0.8, marginBottom: '2px' }}>NAKSH FOUNDATION PRESENTS</div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#f59e0b', letterSpacing: '0.5px' }}>PROJECT DELHI</div>
                      <div style={{ width: '60px', height: '1px', background: 'rgba(255,255,255,0.2)', margin: '4px auto 0' }} />
                    </div>

                    {/* Mid Title & Category */}
                    <div style={{ textAlign: 'center', zIndex: 2, margin: '10px 0' }}>
                      <span style={{ fontSize: '0.55rem', background: 'rgba(255,255,255,0.1)', padding: '3px 8px', borderRadius: '10px', display: 'inline-block', marginBottom: '8px' }}>
                        {catData.emoji} {catData.label.toUpperCase()}
                      </span>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, lineHeight: 1.25, color: '#fff', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {task.title}
                      </h4>
                    </div>

                    {/* Details block */}
                    <div 
                      style={{
                        background: 'rgba(255,255,255,0.06)',
                        borderRadius: '8px',
                        padding: '10px 12px',
                        fontSize: '0.62rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                        border: '1px solid rgba(255,255,255,0.1)',
                        zIndex: 2,
                        textAlign: 'left'
                      }}
                    >
                      <div><span style={{ color: '#f59e0b', fontWeight: 700 }}>📅 DATE:</span> {task.eventDate}</div>
                      <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}><span style={{ color: '#f59e0b', fontWeight: 700 }}>📍 PLACE:</span> <span>{task.locality}</span></div>
                      <div><span style={{ color: '#f59e0b', fontWeight: 700 }}>👥 TARGET:</span> {task.volunteersNeeded} Volunteers</div>
                    </div>

                    {/* Footer */}
                    <div style={{ textAlign: 'center', fontSize: '0.45rem', opacity: 0.8, zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                      <div>Scan QR or register online to join us</div>
                      {qrCodeUrl ? (
                        <div style={{ background: '#FAF8F5', padding: '3px', borderRadius: '4px', display: 'inline-flex' }}>
                          <img src={qrCodeUrl} alt="QR Code" style={{ width: '38px', height: '38px', display: 'block' }} />
                        </div>
                      ) : (
                        <div style={{ width: '38px', height: '38px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px' }} />
                      )}
                      <div style={{ fontWeight: 600, color: '#f59e0b', wordBreak: 'break-all' }}>projectdelhi.org</div>
                    </div>
                  </div>

                  <button
                    onClick={downloadPoster}
                    className="btn btn-primary btn-sm"
                    style={{
                      width: '100%',
                      maxWidth: '270px',
                      justifyContent: 'center',
                      background: '#8c2424',
                      borderColor: '#8c2424',
                      fontWeight: 600
                    }}
                  >
                    📥 Download Invite Poster (PNG)
                  </button>
                </div>

                {/* Right Column: Share Operations */}
                <div style={{ flex: '1.2 1 300px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: '1.5', marginTop: 0 }}>
                      Share this event invite card or copy the preformatted description to share on your social media status/stories!
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                      {/* WhatsApp Share Button */}
                      <a
                        href={`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '12px 16px',
                          borderRadius: '8px',
                          border: '1px solid #25D366',
                          background: '#25D36615',
                          color: '#128C7E',
                          textDecoration: 'none',
                          fontWeight: 600,
                          fontSize: '0.92rem'
                        }}
                      >
                        <span style={{ fontSize: '1.2rem' }}>💬</span> Share on WhatsApp
                      </a>

                      {/* Telegram Share Button */}
                      <a
                        href={`https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(shareText)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '12px 16px',
                          borderRadius: '8px',
                          border: '1px solid #0088cc',
                          background: '#0088cc15',
                          color: '#0088cc',
                          textDecoration: 'none',
                          fontWeight: 600,
                          fontSize: '0.92rem'
                        }}
                      >
                        <span style={{ fontSize: '1.2rem' }}>✈️</span> Share on Telegram
                      </a>

                      {/* Twitter/X Share Button */}
                      <a
                        href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText.substring(0, 240))}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '12px 16px',
                          borderRadius: '8px',
                          border: '1px solid #1DA1F2',
                          background: '#1DA1F215',
                          color: '#1DA1F2',
                          textDecoration: 'none',
                          fontWeight: 600,
                          fontSize: '0.92rem'
                        }}
                      >
                        <span style={{ fontSize: '1.2rem' }}>🐦</span> Share on Twitter / X
                      </a>

                      {/* Copy Link Button */}
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(shareText);
                          addToast("Invite details message copied to clipboard! Share it with the link in your bio.", "success");
                        }}
                        className="btn btn-outline"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '12px',
                          padding: '12px 16px',
                          borderRadius: '8px',
                          fontWeight: 600,
                          fontSize: '0.92rem',
                          border: '1px solid var(--border)',
                          background: 'transparent',
                          cursor: 'pointer'
                        }}
                      >
                        <Copy size={16} /> Copy Invite Message Text
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                    <button 
                      onClick={() => setShowShareModal(false)}
                      className="btn btn-secondary btn-sm"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

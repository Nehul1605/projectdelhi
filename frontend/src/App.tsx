import { useState, useCallback, useEffect } from "react";
import { Routes, Route, Link, useLocation, Navigate } from "react-router-dom";
import {
  MapPin,
  Mail,
  Instagram,
  Linkedin,
  BookOpen,
  HeartHandshake,
  Trophy,
  Github,
} from "lucide-react";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import { LogoFull } from "./components/Logo";
import Browse from "./pages/Browse";
import Submit from "./pages/Submit";
import TaskDetail from "./pages/TaskDetail";
import Admin from "./pages/Admin";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Donate from "./pages/Donate";
import VolunteerDashboard from "./pages/VolunteerDashboard";
import UserDashboard from "./pages/UserDashboard";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import DonationPolicy from "./pages/DonationPolicy";
import ResetPassword from "./pages/ResetPassword";
import Toast, { ToastData } from "./components/Toast";
import { getCurrentUser, subscribeEmail, registerGeneralVolunteer, registerGeneralPartner } from "./store";

function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles?: string[];
}) {
  const user = getCurrentUser();
  const location = useLocation();

  if (!user) {
    let message = "Please log in to continue.";
    if (location.pathname === "/submit") {
      message = "Please log in to propose an initiative.";
    } else if (location.pathname === "/dashboard") {
      message = "Please log in to access your dashboard.";
    } else if (location.pathname === "/admin") {
      message = "Please log in to access the Admin Panel.";
    } else if (location.pathname === "/volunteer-dashboard") {
      message = "Please log in to access the Moderator Panel.";
    }
    return <Navigate to="/login" state={{ from: location.pathname + location.search, message }} replace />;
  }
  if (allowedRoles && !allowedRoles.includes(user.role))
    return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const location = useLocation();
  const [subscribeEmailVal, setSubscribeEmailVal] = useState("");
  const [subscribing, setSubscribing] = useState(false);
  const [showCreditsTooltip, setShowCreditsTooltip] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subscribeEmailVal) return;
    setSubscribing(true);
    const res = await subscribeEmail(subscribeEmailVal);
    setSubscribing(false);
    if (res.success) {
      addToast(res.message, "success");
      setSubscribeEmailVal("");
    } else {
      addToast(res.message, "error");
    }
  };

  const [showVolunteerModal, setShowVolunteerModal] = useState(false);
  const [volForm, setVolForm] = useState({
    name: "",
    email: "",
    phone: "",
    preferredRole: "",
    location: "",
  });
  const [volSubmitting, setVolSubmitting] = useState(false);

  const openVolunteerModal = () => {
    const user = getCurrentUser();
    setVolForm({
      name: user?.name || "",
      email: user?.email || "",
      phone: "",
      preferredRole: "",
      location: "",
    });
    setShowVolunteerModal(true);
  };

  const handleVolunteerRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!volForm.name || !volForm.email || !volForm.phone || !volForm.preferredRole || !volForm.location) {
      addToast("All fields are required", "error");
      return;
    }
    setVolSubmitting(true);
    const res = await registerGeneralVolunteer(volForm);
    setVolSubmitting(false);
    if (res.success) {
      addToast(res.message, "success");
      setShowVolunteerModal(false);
      setVolForm({
        name: "",
        email: "",
        phone: "",
        preferredRole: "",
        location: "",
      });
    } else {
      addToast(res.message, "error");
    }
  };

  const [showPartnerModal, setShowPartnerModal] = useState(false);
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

  const openPartnerModal = () => {
    const user = getCurrentUser();
    setPartnerForm({
      orgName: "",
      orgType: "",
      contactName: user?.name || "",
      designation: "",
      email: user?.email || "",
      phone: "",
      collabReason: "",
      location: "",
    });
    setShowPartnerModal(true);
  };

  const handlePartnerRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const { orgName, orgType, contactName, designation, email, phone, collabReason, location } = partnerForm;
    if (!orgName || !orgType || !contactName || !designation || !email || !phone || !collabReason || !location) {
      addToast("All fields are required", "error");
      return;
    }
    setPartnerSubmitting(true);
    const res = await registerGeneralPartner(partnerForm);
    setPartnerSubmitting(false);
    if (res.success) {
      addToast(res.message, "success");
      setShowPartnerModal(false);
      setPartnerForm({
        orgName: "",
        orgType: "",
        contactName: "",
        designation: "",
        email: "",
        phone: "",
        collabReason: "",
        location: "",
      });
    } else {
      addToast(res.message, "error");
    }
  };

  useEffect(() => {
    // Scroll to top on every navigation
    window.scrollTo(0, 0);

    // Scroll to hash if present
    if (location.hash) {
      const element = document.getElementById(location.hash.substring(1));
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 100);
      }
    }
  }, [location.pathname, location.hash]);

  const addToast = useCallback(
    (message: string, type: "success" | "error" | "info" = "success") => {
      const id = Date.now().toString();
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3000);
    },
    [],
  );

  return (
    <>
      {/* Animated floating orbs background */}
      <div className="animated-bg">
        <div className="orb" />
        <div className="orb" />
        <div className="orb" />
        <div className="orb" />
      </div>

      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/campaigns" element={<Home />} />
        <Route path="/features" element={<Home />} />
        <Route path="/volunteer-guide" element={<Home />} />
        <Route path="/browse" element={<Browse />} />
        <Route
          path="/submit"
          element={
            <ProtectedRoute allowedRoles={["USER"]}>
              <Submit addToast={addToast} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={["USER"]}>
              <UserDashboard addToast={addToast} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/volunteer-dashboard"
          element={
            <ProtectedRoute allowedRoles={["MODERATOR", "ADMIN"]}>
              <VolunteerDashboard addToast={addToast} />
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<Login addToast={addToast} />} />
        <Route path="/signup" element={<Signup addToast={addToast} />} />
        <Route path="/reset-password" element={<ResetPassword addToast={addToast} />} />
        <Route path="/donate" element={<Donate />} />
        <Route path="/task/:id" element={<TaskDetail addToast={addToast} />} />
        <Route path="/initiatives/:slug" element={<TaskDetail addToast={addToast} />} />
        <Route path="/events/:slug" element={<TaskDetail addToast={addToast} />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <Admin addToast={addToast} />
            </ProtectedRoute>
          }
        />
        <Route path="/privacy-policy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/donation-policy" element={<DonationPolicy />} />
      </Routes>

      <footer
        className="footer"
        style={{
          background: "var(--bg-card)",
          borderTop: "1px solid var(--border-light)",
          padding: "80px 0 40px",
          marginTop: "80px",
        }}
      >
        <div className="container">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "48px",
              marginBottom: "64px",
              textAlign: "left",
            }}
          >
            <div>
              <Link
                to="/#home"
                className="navbar-brand"
                style={{
                  display: "inline-flex",
                  marginBottom: "20px",
                  textDecoration: "none",
                }}
              >
                <LogoFull size={58} />
              </Link>
              <p
                style={{
                  color: "var(--text-muted)",
                  lineHeight: 1.6,
                  fontSize: "0.95rem",
                  marginBottom: "24px",
                }}
              >
                Empowering every citizen to be the change they want to see in
                the capital. Join the movement for a better tomorrow.
              </p>
              <div style={{ display: "flex", gap: "16px" }}>
                <a
                  href="https://instagram.com/projectdelhi.naksh"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: "var(--text-muted)",
                    transition: "color 0.2s",
                  }}
                  onMouseOver={(e) =>
                    (e.currentTarget.style.color = "var(--primary)")
                  }
                  onMouseOut={(e) =>
                    (e.currentTarget.style.color = "var(--text-muted)")
                  }
                  aria-label="Instagram"
                >
                  <Instagram size={20} />
                </a>
                <a
                  href="http://linkedin.com/company/projectdelhi"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: "var(--text-muted)",
                    transition: "color 0.2s",
                  }}
                  onMouseOver={(e) =>
                    (e.currentTarget.style.color = "var(--primary)")
                  }
                  onMouseOut={(e) =>
                    (e.currentTarget.style.color = "var(--text-muted)")
                  }
                  aria-label="LinkedIn"
                >
                  <Linkedin size={20} />
                </a>
              </div>
            </div>

            <div>
              <h4 style={{ marginBottom: "20px", fontWeight: 800 }}>
                Platform
              </h4>
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                <li>
                  <Link
                    to="/campaigns"
                    style={{
                      color: "var(--text-muted)",
                      textDecoration: "none",
                      transition: "color 0.2s",
                    }}
                    onMouseOver={(e) =>
                      (e.currentTarget.style.color = "var(--primary)")
                    }
                    onMouseOut={(e) =>
                      (e.currentTarget.style.color = "var(--text-muted)")
                    }
                  >
                    Active Campaigns
                  </Link>
                </li>
                <li>
                  <Link
                    to="/features"
                    style={{
                      color: "var(--text-muted)",
                      textDecoration: "none",
                      transition: "color 0.2s",
                    }}
                    onMouseOver={(e) =>
                      (e.currentTarget.style.color = "var(--primary)")
                    }
                    onMouseOut={(e) =>
                      (e.currentTarget.style.color = "var(--text-muted)")
                    }
                  >
                    Platform Features
                  </Link>
                </li>
                <li>
                  <Link
                    to="/submit"
                    style={{
                      color: "var(--text-muted)",
                      textDecoration: "none",
                      transition: "color 0.2s",
                    }}
                    onMouseOver={(e) =>
                      (e.currentTarget.style.color = "var(--primary)")
                    }
                    onMouseOut={(e) =>
                      (e.currentTarget.style.color = "var(--text-muted)")
                    }
                  >
                    Raise a Proposal
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 style={{ marginBottom: "20px", fontWeight: 800 }}>
                Community
              </h4>
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                <li>
                  <Link
                    to="/volunteer-guide"
                    style={{
                      color: "var(--text-muted)",
                      textDecoration: "none",
                      transition: "color 0.2s",
                    }}
                    onMouseOver={(e) =>
                      (e.currentTarget.style.color = "var(--primary)")
                    }
                    onMouseOut={(e) =>
                      (e.currentTarget.style.color = "var(--text-muted)")
                    }
                  >
                    Volunteer Guide
                  </Link>
                </li>
                <li>
                  <Link
                    to="/donate"
                    style={{
                      color: "var(--text-muted)",
                      textDecoration: "none",
                      transition: "color 0.2s",
                    }}
                    onMouseOver={(e) =>
                      (e.currentTarget.style.color = "var(--primary)")
                    }
                    onMouseOut={(e) =>
                      (e.currentTarget.style.color = "var(--text-muted)")
                    }
                  >
                    Support Initiatives
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 style={{ marginBottom: "20px", fontWeight: 800 }}>Contact</h4>
              <div
                style={{
                  color: "var(--text-muted)",
                  fontSize: "0.95rem",
                  lineHeight: 1.6,
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    alignItems: "flex-start",
                  }}
                >
                  <Mail
                    size={18}
                    style={{ color: "var(--primary)", marginTop: "2px" }}
                  />
                  <a
                    href="mailto:hello@projectdelhi.org"
                    style={{
                      color: "inherit",
                      textDecoration: "none",
                      transition: "color 0.2s",
                    }}
                    onMouseOver={(e) =>
                      (e.currentTarget.style.color = "var(--primary)")
                    }
                    onMouseOut={(e) =>
                      (e.currentTarget.style.color = "inherit")
                    }
                  >
                    hello@projectdelhi.org
                  </a>
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    alignItems: "flex-start",
                  }}
                >
                  <MapPin
                    size={18}
                    style={{ color: "var(--primary)", marginTop: "2px" }}
                  />
                  <span>
                    Indra Vihar, Mukherjee Nagar,
                    <br />
                    New Delhi - 110009
                  </span>
                </div>
              </div>
            </div>
          </div>

          <hr
            style={{
              border: "none",
              borderTop: "1px solid var(--border-light)",
              margin: "40px 0",
            }}
          />

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "48px",
              marginBottom: "32px",
              textAlign: "left",
            }}
          >
            <div>
              <h4 style={{ marginBottom: "12px", fontWeight: 800 }}>Partnerships</h4>
              <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "12px", lineHeight: 1.4 }}>
                Collab with us on upcoming initiatives to drive change in Delhi.
              </p>
              <button
                onClick={openPartnerModal}
                className="btn btn-primary btn-sm"
                style={{
                  width: "100%",
                  justifyContent: "center",
                }}
              >
                Partner with Us
              </button>
            </div>

            <div>
              <h4 style={{ marginBottom: "12px", fontWeight: 800 }}>Volunteer Pool</h4>
              <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "12px", lineHeight: 1.4 }}>
                Join our general pool to get notified of upcoming opportunities.
              </p>
              <button
                onClick={openVolunteerModal}
                className="btn btn-primary btn-sm"
                style={{ width: "100%", justifyContent: "center" }}
              >
                Register as Volunteer
              </button>
            </div>

            <div>
              <h4 style={{ marginBottom: "12px", fontWeight: 800 }}>Stay Updated</h4>
              <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "12px", lineHeight: 1.4 }}>
                Subscribe to our newsletter for updates and campaign alerts.
              </p>
              <form onSubmit={handleSubscribe} style={{ display: "flex", gap: "8px" }}>
                <input
                  type="email"
                  placeholder="Enter your email"
                  required
                  value={subscribeEmailVal}
                  onChange={(e) => setSubscribeEmailVal(e.target.value)}
                  style={{
                    padding: "8px 12px",
                    borderRadius: "6px",
                    border: "1px solid var(--border)",
                    background: "var(--bg)",
                    color: "var(--text)",
                    fontSize: "0.85rem",
                    outline: "none",
                    flex: 1,
                    boxSizing: "border-box"
                  }}
                />
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  style={{ justifyContent: "center", whiteSpace: "nowrap" }}
                  disabled={subscribing}
                >
                  {subscribing ? "Subscribing..." : "Subscribe"}
                </button>
              </form>
            </div>
          </div>

          <div
            className="footer-bottom-row"
            style={{
              borderTop: "1px solid var(--border-light)",
              paddingTop: "32px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "20px",
            }}
          >
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", margin: 0 }} className="footer-copyright-text">
              © {new Date().getFullYear()} projectdelhi.org — Built with ❤️ for the people of Delhi
            </p>

            <div 
              style={{ 
                position: "relative",
                display: "inline-block"
              }}
              onMouseEnter={() => setShowCreditsTooltip(true)}
              onMouseLeave={() => setShowCreditsTooltip(false)}
            >
              <span style={{ fontSize: "0.9rem", color: "var(--text-muted)", cursor: "pointer" }}>
                Designed & Developed by{" "}
                <span 
                  style={{ 
                    color: "var(--primary)", 
                    fontWeight: 700,
                    textDecoration: "underline",
                    textUnderlineOffset: "4px",
                    transition: "color 0.2s"
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.color = "var(--primary-light)")}
                  onMouseOut={(e) => (e.currentTarget.style.color = "var(--primary)")}
                >
                  Nehul Gupta
                </span>
              </span>

              {showCreditsTooltip && (
                <div
                  style={{
                    position: "absolute",
                    bottom: "100%",
                    left: "50%",
                    transform: "translateX(-50%) translateY(-12px)",
                    background: "var(--bg-card)",
                    border: "1px solid var(--border)",
                    borderRadius: "12px",
                    padding: "16px",
                    boxShadow: "var(--shadow-lg)",
                    zIndex: 10,
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                    minWidth: "200px",
                    textAlign: "center",
                    animation: "fadeIn 0.2s ease",
                  }}
                >
                  {/* Invisible spacer to bridge the hover gap */}
                  <div
                    style={{
                      position: "absolute",
                      top: "100%",
                      left: "-20px",
                      right: "-20px",
                      height: "20px",
                      background: "transparent",
                    }}
                  />
                  {/* Tooltip Arrow */}
                  <div
                    style={{
                      position: "absolute",
                      top: "100%",
                      left: "50%",
                      transform: "translateX(-50%)",
                      width: 0,
                      height: 0,
                      borderLeft: "8px solid transparent",
                      borderRight: "8px solid transparent",
                      borderTop: "8px solid var(--bg-card)",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      top: "100%",
                      left: "50%",
                      transform: "translateX(-50%) translateY(1px)",
                      width: 0,
                      height: 0,
                      borderLeft: "9px solid transparent",
                      borderRight: "9px solid transparent",
                      borderTop: "9px solid var(--border)",
                      zIndex: -1,
                    }}
                  />

                  <div style={{ fontWeight: 800, fontSize: "0.75rem", color: "var(--text)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Connect with me
                  </div>

                  <div style={{ display: "flex", justifyContent: "center", gap: "16px" }}>
                    <a
                      href="mailto:nehulgoyal18@gmail.com"
                      title="Email Nehul"
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        background: "rgba(140, 36, 36, 0.05)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--primary)",
                        transition: "all 0.2s",
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = "var(--primary)";
                        e.currentTarget.style.color = "white";
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = "rgba(140, 36, 36, 0.05)";
                        e.currentTarget.style.color = "var(--primary)";
                      }}
                    >
                      <Mail size={18} />
                    </a>
                    <a
                      href="https://www.linkedin.com/in/nehulgupta16"
                      target="_blank"
                      rel="noopener noreferrer"
                      title="LinkedIn"
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        background: "rgba(140, 36, 36, 0.05)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--primary)",
                        transition: "all 0.2s",
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = "var(--primary)";
                        e.currentTarget.style.color = "white";
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = "rgba(140, 36, 36, 0.05)";
                        e.currentTarget.style.color = "var(--primary)";
                      }}
                    >
                      <Linkedin size={18} />
                    </a>
                    <a
                      href="https://github.com/Nehul1605"
                      target="_blank"
                      rel="noopener noreferrer"
                      title="GitHub"
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        background: "rgba(140, 36, 36, 0.05)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--primary)",
                        transition: "all 0.2s",
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = "var(--primary)";
                        e.currentTarget.style.color = "white";
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = "rgba(140, 36, 36, 0.05)";
                        e.currentTarget.style.color = "var(--primary)";
                      }}
                    >
                      <Github size={18} />
                    </a>
                  </div>
                </div>
              )}
            </div>
            <div style={{ display: "flex", gap: "24px" }} className="footer-legal-links">
              <Link
                to="/privacy-policy"
                style={{
                  color: "var(--text-muted)",
                  textDecoration: "none",
                  fontSize: "0.9rem",
                }}
              >
                Privacy Policy
              </Link>
              <Link
                to="/terms"
                style={{
                  color: "var(--text-muted)",
                  textDecoration: "none",
                  fontSize: "0.9rem",
                }}
              >
                Terms of Service
              </Link>
              <Link
                to="/donation-policy"
                style={{
                  color: "var(--text-muted)",
                  textDecoration: "none",
                  fontSize: "0.9rem",
                }}
              >
                Donation Policy
              </Link>
            </div>
          </div>
        </div>
      </footer>

      <Toast toasts={toasts} />

      {showVolunteerModal && (
        <div className="modal-overlay" onClick={() => setShowVolunteerModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Join Our General Volunteer Pool</h2>
            <p style={{ color: "var(--text-muted)", marginBottom: "20px" }}>
              Fill in your details below and we will contact you for upcoming opportunities.
            </p>
            <form onSubmit={handleVolunteerRegister}>
              <div className="form-group">
                <label htmlFor="reg-name">Your Name <span className="required">*</span></label>
                <input
                  type="text"
                  id="reg-name"
                  required
                  placeholder="Your full name"
                  value={volForm.name}
                  onChange={(e) => setVolForm({ ...volForm, name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label htmlFor="reg-email">Email <span className="required">*</span></label>
                <input
                  type="email"
                  id="reg-email"
                  required
                  placeholder="your@email.com"
                  value={volForm.email}
                  onChange={(e) => setVolForm({ ...volForm, email: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label htmlFor="reg-phone">Phone Number <span className="required">*</span></label>
                <input
                  type="tel"
                  id="reg-phone"
                  required
                  pattern="^\+?[0-9\s\-]+$"
                  title="Please enter a valid phone number (digits, spaces, or leading +)"
                  onKeyPress={(e) => {
                    if (!/[0-9\s\-+]/.test(e.key)) {
                      e.preventDefault();
                    }
                  }}
                  placeholder="Phone number (e.g. +91XXXXXXXXXX)"
                  value={volForm.phone}
                  onChange={(e) => setVolForm({ ...volForm, phone: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label htmlFor="reg-role">Preferred Role/Work <span className="required">*</span></label>
                <select
                  id="reg-role"
                  required
                  value={volForm.preferredRole}
                  onChange={(e) => setVolForm({ ...volForm, preferredRole: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "6px",
                    border: "1px solid var(--border)",
                    background: "var(--bg)",
                    color: "var(--text)",
                    outline: "none",
                  }}
                >
                  <option value="" disabled>Select a preferred role</option>
                  <option value="Environmental Protection (Cleanups, Plantations)">Environmental Protection (Cleanups, Plantations)</option>
                  <option value="Education & Mentorship">Education & Mentorship</option>
                  <option value="Event Organizing & Logistics">Event Organizing & Logistics</option>
                  <option value="Tech, Design & Content Creation">Tech, Design & Content Creation</option>
                  <option value="Healthcare Support">Healthcare Support</option>
                  <option value="Social Work & Relief Operations">Social Work & Relief Operations</option>
                  <option value="Any / Where Needed">Any / Where Needed</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="reg-location">Preferred Location / Locality <span className="required">*</span></label>
                <input
                  type="text"
                  id="reg-location"
                  required
                  placeholder="e.g. Mukherjee Nagar, Delhi"
                  value={volForm.location}
                  onChange={(e) => setVolForm({ ...volForm, location: e.target.value })}
                />
              </div>
              <div style={{ display: "flex", gap: 12, marginTop: "24px" }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ flex: 1, justifyContent: "center" }}
                  onClick={() => setShowVolunteerModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1, justifyContent: "center" }}
                  disabled={volSubmitting}
                >
                  {volSubmitting ? "Submitting..." : "Submit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPartnerModal && (
        <div className="modal-overlay" onClick={() => setShowPartnerModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Partner / Collaborate with Us</h2>
            <p style={{ color: "var(--text-muted)", marginBottom: "20px" }}>
              Submit your organization's details to collaborate on future social and environmental campaigns in Delhi.
            </p>
            <form onSubmit={handlePartnerRegister}>
              <div className="form-group">
                <label htmlFor="p-org-name">Organization Name <span className="required">*</span></label>
                <input
                  type="text"
                  id="p-org-name"
                  required
                  placeholder="Your organization's name"
                  value={partnerForm.orgName}
                  onChange={(e) => setPartnerForm({ ...partnerForm, orgName: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label htmlFor="p-org-type">Organization Type <span className="required">*</span></label>
                <select
                  id="p-org-type"
                  required
                  value={partnerForm.orgType}
                  onChange={(e) => setPartnerForm({ ...partnerForm, orgType: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "6px",
                    border: "1px solid var(--border)",
                    background: "var(--bg)",
                    color: "var(--text)",
                    outline: "none",
                  }}
                >
                  <option value="" disabled>Select organization type</option>
                  <option value="Corporate">Corporate</option>
                  <option value="NGO / NPO">NGO / NPO</option>
                  <option value="Government">Government</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="p-contact-name">Contact Person Name <span className="required">*</span></label>
                <input
                  type="text"
                  id="p-contact-name"
                  required
                  placeholder="Full name of contact person"
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
                  placeholder="e.g. Director, Manager"
                  value={partnerForm.designation}
                  onChange={(e) => setPartnerForm({ ...partnerForm, designation: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label htmlFor="p-email">Email Address <span className="required">*</span></label>
                <input
                  type="email"
                  id="p-email"
                  required
                  placeholder="contact@org.com"
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
                  pattern="^\+?[0-9\s\-]+$"
                  title="Please enter a valid phone number (digits, spaces, or leading +)"
                  onKeyPress={(e) => {
                    if (!/[0-9\s\-+]/.test(e.key)) {
                      e.preventDefault();
                    }
                  }}
                  placeholder="Contact phone number"
                  value={partnerForm.phone}
                  onChange={(e) => setPartnerForm({ ...partnerForm, phone: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label htmlFor="p-location">Operational Locality <span className="required">*</span></label>
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
                  placeholder="Explain how you would like to collaborate (e.g. funding, volunteer supply, logistics, co-organizing events...)"
                  value={partnerForm.collabReason}
                  onChange={(e) => setPartnerForm({ ...partnerForm, collabReason: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "6px",
                    border: "1px solid var(--border)",
                    background: "var(--bg)",
                    color: "var(--text)",
                    outline: "none",
                    fontFamily: "inherit",
                    fontSize: "0.95rem"
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: 12, marginTop: "24px" }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ flex: 1, justifyContent: "center" }}
                  onClick={() => setShowPartnerModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{
                    flex: 1,
                    justifyContent: "center",
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
    </>
  );
}

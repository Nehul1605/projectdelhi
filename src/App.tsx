import { useState, useCallback, useEffect } from "react";
import { Routes, Route, Link, useLocation, Navigate } from "react-router-dom";
import {
  MapPin,
  Mail,
  Twitter,
  Instagram,
  Linkedin,
  Github,
  BookOpen,
  HeartHandshake,
  Trophy,
} from "lucide-react";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Browse from "./pages/Browse";
import Submit from "./pages/Submit";
import TaskDetail from "./pages/TaskDetail";
import Admin from "./pages/Admin";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Donate from "./pages/Donate";
import VolunteerDashboard from "./pages/VolunteerDashboard";
import Toast, { ToastData } from "./components/Toast";
import { getCurrentUser } from "./store";

function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles?: string[];
}) {
  const user = getCurrentUser();
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role))
    return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const location = useLocation();

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
          path="/volunteer-dashboard"
          element={
            <ProtectedRoute allowedRoles={["MODERATOR", "ADMIN"]}>
              <VolunteerDashboard addToast={addToast} />
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<Login addToast={addToast} />} />
        <Route path="/signup" element={<Signup addToast={addToast} />} />
        <Route path="/donate" element={<Donate />} />
        <Route path="/task/:id" element={<TaskDetail addToast={addToast} />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <Admin addToast={addToast} />
            </ProtectedRoute>
          }
        />
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
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
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
                  display: "flex",
                  marginBottom: "20px",
                  textDecoration: "none",
                }}
              >
                <div
                  className="logo-icon"
                  style={{
                    background: "transparent",
                    color: "var(--primary)",
                    marginRight: "8px",
                  }}
                >
                  <MapPin size={32} strokeWidth={2.5} />
                </div>
                <span
                  style={{
                    fontSize: "1.5rem",
                    letterSpacing: "-0.5px",
                    color: "var(--text)",
                  }}
                >
                  Project <span style={{ color: "var(--primary)" }}>Delhi</span>
                </span>
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
                  href="#"
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
                  aria-label="Twitter"
                >
                  <Twitter size={20} />
                </a>
                <a
                  href="#"
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
                  href="#"
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
                <a
                  href="#"
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
                  aria-label="GitHub"
                >
                  <Github size={20} />
                </a>
              </div>
            </div>

            <div>
              <h4 style={{ marginBottom: "20px", fontWeight: 700 }}>
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
                    to="/#success-stories"
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
                    to="/#impact-areas"
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
              <h4 style={{ marginBottom: "20px", fontWeight: 700 }}>
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
                    to="/#volunteer-guide"
                    style={{
                      color: "var(--text-muted)",
                      textDecoration: "none",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      transition: "color 0.2s",
                    }}
                    onMouseOver={(e) =>
                      (e.currentTarget.style.color = "var(--primary)")
                    }
                    onMouseOut={(e) =>
                      (e.currentTarget.style.color = "var(--text-muted)")
                    }
                  >
                    <BookOpen size={18} /> Volunteer Guide
                  </Link>
                </li>
                <li>
                  <Link
                    to="/#partners"
                    style={{
                      color: "var(--text-muted)",
                      textDecoration: "none",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      transition: "color 0.2s",
                    }}
                    onMouseOver={(e) =>
                      (e.currentTarget.style.color = "var(--primary)")
                    }
                    onMouseOut={(e) =>
                      (e.currentTarget.style.color = "var(--text-muted)")
                    }
                  >
                    <HeartHandshake size={18} /> NGO Partners
                  </Link>
                </li>
                <li>
                  <Link
                    to="/#success-stories"
                    style={{
                      color: "var(--text-muted)",
                      textDecoration: "none",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      transition: "color 0.2s",
                    }}
                    onMouseOver={(e) =>
                      (e.currentTarget.style.color = "var(--primary)")
                    }
                    onMouseOut={(e) =>
                      (e.currentTarget.style.color = "var(--text-muted)")
                    }
                  >
                    <Trophy size={18} /> Success Stories
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 style={{ marginBottom: "20px", fontWeight: 700 }}>Contact</h4>
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
                  <span>hello@projectdelhi.org</span>
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
                    Connaught Place,
                    <br />
                    New Delhi - 110001
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div
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
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
              © {new Date().getFullYear()} Project Delhi — Built with ❤️ for the
              people of Delhi
            </p>
            <div style={{ display: "flex", gap: "24px" }}>
              <a
                href="#"
                style={{
                  color: "var(--text-muted)",
                  textDecoration: "none",
                  fontSize: "0.9rem",
                }}
              >
                Privacy Policy
              </a>
              <a
                href="#"
                style={{
                  color: "var(--text-muted)",
                  textDecoration: "none",
                  fontSize: "0.9rem",
                }}
              >
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </footer>

      <Toast toasts={toasts} />
    </>
  );
}

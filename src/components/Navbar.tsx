import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { MapPin, LogOut } from "lucide-react";
import { getCurrentUser, userLogout } from "../store";

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    userLogout();
    navigate("/");
  };

  const isActive = (path: string) =>
    location.pathname === path ? "active" : "";

  const user = getCurrentUser();

  return (
    <nav className={`navbar ${scrolled ? "scrolled" : ""}`}>
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand">
          <div
            className="logo-icon"
            style={{ background: "transparent", color: "var(--primary)" }}
          >
            <MapPin size={32} strokeWidth={2.5} />
          </div>
          <span style={{ fontSize: "1.5rem", letterSpacing: "-0.5px" }}>
            Project <span style={{ color: "var(--primary)" }}>Delhi</span>
          </span>
        </Link>

        <button
          className="mobile-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? "✕" : "☰"}
        </button>

        <div className={`navbar-links ${menuOpen ? "open" : ""}`}>
          <Link
            to="/"
            className={isActive("/")}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            Home
          </Link>
          <Link to="/browse" className={isActive("/browse")}>
            Browse Tasks
          </Link>
          {user?.role === "USER" && (
            <Link to="/submit" className={isActive("/submit")}>
              Raise a Proposal
            </Link>
          )}
          {user?.role === "MODERATOR" && (
            <Link
              to="/volunteer-dashboard"
              className={isActive("/volunteer-dashboard")}
            >
              Moderator Panel
            </Link>
          )}
          {user?.role === "ADMIN" && (
            <Link to="/admin" className={isActive("/admin")}>
              Admin Panel
            </Link>
          )}
          <Link to="/donate" className={isActive("/donate")}>
            Donate
          </Link>
          {user ? (
            <button
              onClick={handleLogout}
              className="btn btn-sm"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                color: "var(--danger)",
                padding: "8px 12px",
              }}
            >
              <LogOut size={16} /> Logout
            </button>
          ) : (
            <Link to="/login" className={isActive("/login")}>
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

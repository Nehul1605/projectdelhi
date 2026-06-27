import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { getCurrentUser, userLogout } from "../store";
import { LogoFull } from "./Logo";

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [logoSize, setLogoSize] = useState(window.innerWidth < 480 ? 44 : 72);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    const handleResize = () => setLogoSize(window.innerWidth < 480 ? 44 : 72);
    window.addEventListener("scroll", onScroll);
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", handleResize);
    };
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
        <Link to="/" className="navbar-brand" style={{ padding: "0" }}>
          <LogoFull size={logoSize} />
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
            Explore Campaigns
          </Link>
           {user?.role === "USER" && (
            <>
              <Link to="/submit" className={isActive("/submit")}>
                Raise a Proposal
              </Link>
              <Link to="/dashboard" className={isActive("/dashboard")}>
                Dashboard
              </Link>
            </>
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
          <Link
            to="/donate"
            className="btn btn-primary"
            style={{
              padding: "8px 16px",
              fontSize: "0.88rem",
              fontWeight: 700,
              borderRadius: "20px",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              textDecoration: "none",
              marginLeft: "8px",
              color: "white",
              border: "none",
            }}
          >
            Donate
          </Link>
          {user ? (
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginLeft: "8px" }} className="navbar-profile-section">
              <div 
                style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: "8px", 
                  padding: "6px 12px", 
                  borderRadius: "30px", 
                  background: "rgba(140, 36, 36, 0.05)", 
                  border: "1px solid rgba(140, 36, 36, 0.1)" 
                }}
              >
                <div 
                  style={{ 
                    width: "28px", 
                    height: "28px", 
                    borderRadius: "50%", 
                    background: "var(--primary)", 
                    color: "white", 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center", 
                    fontSize: "0.85rem", 
                    fontWeight: 700 
                  }}
                >
                  {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", lineHeight: "1.2" }}>
                  <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text)" }}>
                    {user.name}
                  </span>
                  <span style={{ fontSize: "0.68rem", color: "var(--primary)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.3px" }}>
                    {user.role}
                  </span>
                </div>
              </div>
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
            </div>
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

import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LogOut, X } from "lucide-react";
import { getCurrentUser, userLogout } from "../store";
import { LogoFull } from "./Logo";

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [logoSize, setLogoSize] = useState(window.innerWidth < 768 ? 48 : 72);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    const handleResize = () => setLogoSize(window.innerWidth < 768 ? 48 : 72);
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
          <Link to="/initiatives" className={isActive("/initiatives")}>
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
              <div style={{ position: "relative" }}>
                <div 
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    gap: "8px", 
                    padding: "6px 12px", 
                    borderRadius: "30px", 
                    background: "rgba(140, 36, 36, 0.05)", 
                    border: "1px solid rgba(140, 36, 36, 0.1)",
                    cursor: "pointer",
                    transition: "background 0.2s, transform 0.1s"
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.background = "rgba(140, 36, 36, 0.1)")}
                  onMouseOut={(e) => (e.currentTarget.style.background = "rgba(140, 36, 36, 0.05)")}
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
                      {user.role === "USER" ? "User" : user.role === "MODERATOR" ? "Moderator" : "Admin"}
                    </span>
                  </div>
                </div>

                {showProfileDropdown && (
                  <>
                    <div 
                      onClick={() => setShowProfileDropdown(false)}
                      style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        zIndex: 999,
                        background: "transparent"
                      }}
                    />
                    <div 
                      style={{
                        position: "absolute",
                        top: "calc(100% + 8px)",
                        left: 0,
                        background: "var(--bg-card)",
                        border: "1px solid var(--border-light)",
                        borderRadius: "16px",
                        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.05)",
                        width: "260px",
                        zIndex: 1000,
                        padding: "16px",
                        textAlign: "left",
                        animation: "slideDown 0.2s ease-out"
                      }}
                    >
                      {/* User Header */}
                      <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "12px" }}>
                        <div 
                          style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "50%",
                            background: "var(--primary)",
                            color: "white",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "1.1rem",
                            fontWeight: 700,
                            flexShrink: 0
                          }}
                        >
                          {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                          <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {user.name}
                          </span>
                          <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {user.email}
                          </span>
                        </div>
                      </div>

                      {/* Role Details */}
                      <div 
                        style={{
                          background: "rgba(0,0,0,0.02)",
                          borderRadius: "10px",
                          padding: "10px 12px",
                          border: "1px solid var(--border-light)",
                          fontSize: "0.8rem",
                          marginTop: "8px"
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ color: "var(--text-secondary)", fontWeight: 500 }}>Account Role</span>
                          <span 
                            style={{
                              fontSize: "0.65rem",
                              fontWeight: 700,
                              color: "var(--primary)",
                              background: "rgba(140, 36, 36, 0.08)",
                              padding: "2px 8px",
                              borderRadius: "6px",
                              textTransform: "uppercase"
                            }}
                          >
                            {user.role === "ADMIN" ? "Admin" : user.role === "MODERATOR" ? "Moderator" : "User"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Logout Button (separately in navbar) */}
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

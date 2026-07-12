import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getApprovedTasks, getStats } from "../store";
import TaskCard from "../components/TaskCard";
import {
  ArrowRight,
  PlusCircle,
  CheckCircle,
  Users,
  Globe,
  Shield,
  HeartHandshake,
  Leaf,
  BookOpen,
  X,
} from "lucide-react";

export default function Home() {
  const tasks = getApprovedTasks().slice(0, 4);
  const stats = getStats();
  const location = useLocation();
  const navigate = useNavigate();

  const [promoState, setPromoState] = useState<"hidden" | "showing" | "dismissing">("hidden");
  const transitionTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleDismissPromo = () => {
    setPromoState("dismissing");
    if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
    transitionTimerRef.current = setTimeout(() => {
      setPromoState("hidden");
    }, 400);
  };

  const handleRegisterPromo = () => {
    setPromoState("dismissing");
    if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
    transitionTimerRef.current = setTimeout(() => {
      setPromoState("hidden");
      navigate("/?join-volunteer=true");
    }, 400);
  };

  useEffect(() => {
    const showTimer = setTimeout(() => {
      setPromoState("showing");
    }, 1500); // 1.5 seconds delay
    return () => clearTimeout(showTimer);
  }, []);

  useEffect(() => {
    if (promoState === "showing") {
      const autoDismissTimer = setTimeout(() => {
        handleDismissPromo();
      }, 7000); //  7 seconds auto-dismiss
      return () => clearTimeout(autoDismissTimer);
    }
  }, [promoState]);

  useEffect(() => {
    return () => {
      if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
    };
  }, []);

  useEffect(() => {
    let targetId = "";
    if (location.pathname === "/campaigns") {
      targetId = "success-stories";
    } else if (location.pathname === "/our-causes") {
      targetId = "impact-areas";
    } else if (location.pathname === "/volunteer-journey") {
      targetId = "volunteer-guide";
    }

    if (targetId) {
      const element = document.getElementById(targetId);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
      }
    } else if (location.pathname === "/") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [location.pathname]);

  return (
    <>
      {/* Hero */}
      <section
        id="home"
        className="hero"
        style={{
          position: "relative",
          color: "#fff",
          padding: "180px 0 160px",
          overflow: "hidden",
          maxWidth: "1400px",
          width: "calc(100% - 48px)",
          margin: "24px auto",
          borderRadius: "32px",
        }}
      >
        <video
          autoPlay
          loop
          muted
          playsInline
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            zIndex: 0,
          }}
        >
          <source src="/hero-video.mp4" type="video/mp4" />
        </video>
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "radial-gradient(circle, rgba(0, 0, 0, 0.48) 0%, rgba(0, 0, 0, 0.18) 100%)",
            zIndex: 1,
          }}
        />

        <div className="container" style={{ position: "relative", zIndex: 2 }}>
          <h1 style={{ textShadow: "0 4px 20px rgba(0, 0, 0, 0.85), 0 2px 6px rgba(0, 0, 0, 0.6)" }}>
            Empowering Citizens to <br />
            <span className="highlight">Transform Delhi</span>
          </h1>
          <p style={{ color: "#ffffff", fontWeight: 500, textShadow: "0 2px 12px rgba(0, 0, 0, 0.85), 0 1px 4px rgba(0, 0, 0, 0.6)" }}>
            ProjectDelhi is a unified civic platform that empowers citizens, NGOs, volunteers, and local authorities to collaborate, lead meaningful initiatives, and create measurable social impact across the capital.
          </p>
          <div className="hero-actions">
            <Link to="/submit" className="btn btn-primary btn-lg">
              <PlusCircle size={20} /> Propose an Initiative
            </Link>
            <Link
              to="/initiatives"
              className="btn btn-secondary btn-lg"
              style={{
                background: "rgba(255, 255, 255, 0.15)",
                color: "white",
                borderColor: "rgba(255, 255, 255, 0.3)",
              }}
            >
              <Globe size={20} /> Explore Campaigns
            </Link>
          </div>

          <div style={{ marginTop: "20px", display: "flex", justifyContent: "center", alignItems: "center" }}>
            <Link
              to="/?join-volunteer=true"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                color: "#ffffff",
                fontSize: "0.95rem",
                fontWeight: 600,
                textDecoration: "none",
                background: "rgba(140, 36, 36, 0.85)", // Theme Burgundy
                padding: "10px 20px",
                borderRadius: "30px",
                border: "1.5px solid #f59e0b", // Gold Accent Border
                boxShadow: "0 6px 16px rgba(0, 0, 0, 0.3)",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#8c2424"; // Solid Burgundy
                e.currentTarget.style.borderColor = "#f59e0b";
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(140, 36, 36, 0.85)";
                e.currentTarget.style.borderColor = "#f59e0b";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              🤝 Want to volunteer? Register in our General Pool
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section
        className="page-section"
        style={{ paddingTop: "40px", paddingBottom: "20px" }}
      >
        <div className="container">
          <div className="stats-row" style={{ marginTop: 0 }}>
            <div className="card stat-card">
              <div className="stat-number">{stats.totalTasks}</div>
              <div className="stat-label">Active Campaigns</div>
            </div>
            <div className="card stat-card">
              <div className="stat-number">{stats.totalVolunteers}</div>
              <div className="stat-label">Registered Volunteers</div>
            </div>
            <div className="card stat-card">
              <div className="stat-number">{stats.eventsConducted}</div>
              <div className="stat-label">Events Conducted</div>
            </div>
            <div className="card stat-card">
              <div className="stat-number">{stats.totalPending}</div>
              <div className="stat-label">Proposals Under Review</div>
            </div>
          </div>
        </div>
      </section>


      {/* Impact Areas */}
      <section
        id="impact-areas"
        className="page-section"
        style={{ background: "var(--bg-card)", scrollMarginTop: "110px" }}
      >
        <div className="container">
          <div className="section-header">
            <h2>Where Change Begins</h2>
            <p>
              Focused pathways to mobilize citizens and transform our neighborhoods.
            </p>
          </div>
          <div className="features-grid">
            <div className="card feature-card card-flat">
              <div className="feature-icon">
                <Users size={24} />
              </div>
              <div className="feature-content">
                <h3>People First</h3>
                <p>
                  Empowering communities through education, healthcare, inclusion, livelihoods, and essential social support.
                </p>
              </div>
            </div>
            <div className="card feature-card card-flat">
              <div className="feature-icon">
                <Leaf size={24} />
              </div>
              <div className="feature-content">
                <h3>Green Tomorrow</h3>
                <p>
                  Promoting a cleaner, greener and pollution free Delhi through conservation, sustainability, and resilient urban initiatives.
                </p>
              </div>
            </div>
            <div className="card feature-card card-flat">
              <div className="feature-icon">
                <HeartHandshake size={24} />
              </div>
              <div className="feature-content">
                <h3>Collective Impact</h3>
                <p>
                  Uniting citizens, NGOs, volunteers, and institutions to collaborate, innovate, and create lasting civic impact.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works / Volunteer Guide */}
      <section id="volunteer-guide" className="page-section" style={{ scrollMarginTop: "110px" }}>
        <div className="container">
          <div className="section-header">
            <h2>Your Journey to Change</h2>
            <p>
              Every great change begins with a single step. Join ProjectDelhi and become part of a community that's shaping a better future for the city.
            </p>
          </div>
          <div className="steps-grid">
            <div className="card step-card">
              <div className="step-num">
                <Globe size={24} />
              </div>
              <h3>Discover Your Cause</h3>
              <p>
                Explore meaningful initiatives across Delhi and find a project that aligns with your passion, skills, or interests.
              </p>
            </div>
            <div className="card step-card">
              <div className="step-num">
                <Users size={24} />
              </div>
              <h3>Join the Mission</h3>
              <p>
                Sign up in just a few clicks, connect with the project organizer, and get everything you need to start volunteering.
              </p>
            </div>
            <div className="card step-card">
              <div className="step-num">
                <CheckCircle size={24} />
              </div>
              <h3>Create Real Impact</h3>
              <p>
                Contribute your time, inspire others, and help build a cleaner, stronger, and more inclusive Delhi—one initiative at a time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Tasks / Success Stories */}
      {tasks.length > 0 && (
        <section
          id="success-stories"
          className="page-section"
          style={{ background: "var(--bg-card)", scrollMarginTop: "110px" }}
        >
          <div className="container">
            <div className="section-header">
              <h2>Featured Campaigns</h2>
              <p>
                Discover high-priority initiatives that need your immediate
                support
              </p>
            </div>
            <div className="task-grid">
              {tasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
            <div style={{ textAlign: "center", marginTop: 32 }}>
              <Link to="/initiatives" className="btn btn-secondary">
                View All Campaigns <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* CTA Section - Cinematic Image Approach */}
      <section className="page-section" style={{ paddingBottom: "120px" }}>
        <div className="container">
          <div
            style={{
              position: "relative",
              borderRadius: "48px",
              overflow: "hidden",
              minHeight: "520px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              boxShadow: "0 40px 80px rgba(0,0,0,0.15)",
            }}
          >
            {/* Background Image */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                backgroundImage: 'url("/cta-bg.jpg")',
                backgroundSize: "cover",
                backgroundPosition: "center",
                zIndex: 0,
              }}
            />
            {/* Dark Overlay for Readability */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                background:
                  "linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.7))",
                zIndex: 1,
              }}
            />

            <div
              style={{
                position: "relative",
                zIndex: 2,
                padding: "60px 24px",
                maxWidth: "800px",
              }}
            >
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "rgba(255,255,255,0.15)",
                  backdropFilter: "blur(10px)",
                  padding: "10px 20px",
                  borderRadius: "100px",
                  marginBottom: "32px",
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  color: "white",
                  border: "1px solid rgba(255,255,255,0.2)",
                }}
              >
                <HeartHandshake size={18} /> Empowering 2,500+ Active Delhiites
              </div>

              <h2
                style={{
                  fontSize: "3.8rem",
                  color: "white",
                  marginBottom: "24px",
                  fontWeight: 900,
                  lineHeight: 1.1,
                  letterSpacing: "-0.04em",
                }}
              >
                Shape the Future of <br />
                Our Community
              </h2>

              <p
                style={{
                  color: "rgba(255,255,255,0.95)",
                  fontSize: "1.25rem",
                  lineHeight: 1.6,
                  marginBottom: "48px",
                  maxWidth: "640px",
                  margin: "0 auto 48px",
                }}
              >
                Whether you want to lead or support, your effort makes a real difference. Start today and be part of Delhi's transformation.
              </p>

              <div
                style={{
                  display: "flex",
                  gap: "20px",
                  justifyContent: "center",
                  flexWrap: "wrap",
                }}
              >
                <Link
                  to="/submit"
                  className="btn btn-primary btn-lg"
                  style={{
                    padding: "20px 40px",
                    borderRadius: "16px",
                    fontSize: "1.1rem",
                    boxShadow: "0 10px 20px rgba(0,0,0,0.2)",
                    border: "none",
                  }}
                >
                  Raise a Proposal{" "}
                  <PlusCircle size={20} style={{ marginLeft: "8px" }} />
                </Link>
                <Link
                  to="/initiatives"
                  className="btn btn-lg"
                  style={{
                    padding: "20px 40px",
                    borderRadius: "16px",
                    fontSize: "1.1rem",
                    background: "white",
                    color: "var(--text)",
                    border: "none",
                    boxShadow: "0 10px 20px rgba(0,0,0,0.1)",
                  }}
                >
                  Explore Initiatives{" "}
                  <Globe
                    size={20}
                    style={{ marginLeft: "8px", color: "var(--primary)" }}
                  />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {promoState !== "hidden" && (
        <div className={`volunteer-promo-card ${promoState === "dismissing" ? "dismissing" : ""}`}>
          <button 
            className="volunteer-promo-close" 
            onClick={handleDismissPromo}
            aria-label="Close"
          >
            <X size={16} />
          </button>
          <h4>🤝 Make an Impact in Delhi</h4>
          <p>
            Join our active community of general volunteers to get notified about upcoming clean-up drives, plantation drives, and local civic campaigns.
          </p>
          <div className="volunteer-promo-actions">
            <button className="volunteer-promo-btn-primary" onClick={handleRegisterPromo}>
              Register as Volunteer
            </button>
            <button className="volunteer-promo-btn-secondary" onClick={handleDismissPromo}>
              Maybe Later
            </button>
          </div>
        </div>
      )}
    </>
  );
}

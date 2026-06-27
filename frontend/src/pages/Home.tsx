import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
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
} from "lucide-react";

export default function Home() {
  const tasks = getApprovedTasks().slice(0, 4);
  const stats = getStats();
  const location = useLocation();

  useEffect(() => {
    let targetId = "";
    if (location.pathname === "/campaigns") {
      targetId = "success-stories";
    } else if (location.pathname === "/features") {
      targetId = "impact-areas";
    } else if (location.pathname === "/volunteer-guide") {
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
            Projectdelhi is a unified platform connecting civic-minded
            individuals, NGOs, and local authorities. Launch initiatives,
            mobilize volunteers, and drive measurable social impact across the
            capital.
          </p>
          <div className="hero-actions">
            <Link to="/submit" className="btn btn-primary btn-lg">
              <PlusCircle size={20} /> Propose an Initiative
            </Link>
            <Link
              to="/browse"
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
              <div className="stat-number">{stats.localities}</div>
              <div className="stat-label">Zones Impacted</div>
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
        style={{ background: "var(--bg-card)" }}
      >
        <div className="container">
          <div className="section-header">
            <h2>Areas of Impact</h2>
            <p>
              Our community focuses on key categories to maximize sustainable
              development
            </p>
          </div>
          <div className="features-grid">
            <div className="card feature-card card-flat">
              <div className="feature-icon">
                <Leaf size={24} />
              </div>
              <div className="feature-content">
                <h3>Environmental Action</h3>
                <p>
                  Tree plantation drives, park cleanups, and waste management
                  initiatives in urban areas.
                </p>
              </div>
            </div>
            <div className="card feature-card card-flat">
              <div className="feature-icon">
                <BookOpen size={24} />
              </div>
              <div className="feature-content">
                <h3>Education & Mentorship</h3>
                <p>
                  Volunteer tutoring, skill workshops, and resource distribution
                  for underprivileged youth.
                </p>
              </div>
            </div>
            <div className="card feature-card card-flat">
              <div className="feature-icon">
                <HeartHandshake size={24} />
              </div>
              <div className="feature-content">
                <h3>Community Relief</h3>
                <p>
                  Food distribution, health camps, and emergency support for
                  vulnerable neighborhoods.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works / Volunteer Guide */}
      <section id="volunteer-guide" className="page-section">
        <div className="container">
          <div className="section-header">
            <h2>Volunteer Guide</h2>
            <p>
              New to Projectdelhi? Here is how you can start making an impact
              in your neighborhood.
            </p>
          </div>
          <div className="steps-grid">
            <div className="card step-card">
              <div className="step-num">
                <PlusCircle size={24} />
              </div>
              <h3>1. Discover Projects</h3>
              <p>
                Browse active campaigns in your area. Use filters to find causes
                that match your skills—from teaching to environmental action.
              </p>
            </div>
            <div className="card step-card">
              <div className="step-num">
                <Shield size={24} />
              </div>
              <h3>2. Register & Connect</h3>
              <p>
                Sign up as a volunteer for a specific task. You'll get access to
                the organizer's contact info and coordination details.
              </p>
            </div>
            <div className="card step-card">
              <div className="step-num">
                <Users size={24} />
              </div>
              <h3>3. Take Action</h3>
              <p>
                Show up, contribute, and document your impact. Verified
                volunteers can earn community badges and lead future
                initiatives.
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
          style={{ background: "var(--bg-card)" }}
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
              <Link to="/browse" className="btn btn-secondary">
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
                Whether you want to lead or support, your voice creates ripples
                of change. Start today and be part of Delhi's transformation.
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
                  to="/browse"
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
    </>
  );
}

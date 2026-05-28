import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { loginUser } from "../store";

interface Props {
  addToast: (msg: string, type?: "success" | "error" | "info") => void;
}

export default function Login({ addToast }: Props) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      // For demo: any password works, role determined by email
      const user = loginUser(email, email.split("@")[0]);
      addToast(`Successfully logged in as ${user.role}!`, "success");

      if (user.role === "ADMIN") {
        navigate("/admin");
      } else if (user.role === "MODERATOR") {
        navigate("/volunteer-dashboard");
      } else {
        navigate("/browse");
      }

      setLoading(false);
    }, 800);
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "calc(100vh - 68px)",
        background: "#f1f3f5",
        padding: "24px",
      }}
    >
      <div
        style={{
          display: "flex",
          maxWidth: "1060px",
          width: "100%",
          background: "white",
          borderRadius: "32px",
          overflow: "hidden",
          boxShadow: "0 20px 60px -15px rgba(0, 0, 0, 0.1)",
          minHeight: "620px",
          border: "1px solid rgba(0,0,0,0.05)",
        }}
      >
        {/* Left Side - Video Section (Floating look with padding) */}
        <div
          style={{
            flex: "1",
            position: "relative",
            padding: "20px",
            display: "flex",
          }}
          className="login-video-side"
        >
          <div
            style={{
              position: "relative",
              width: "100%",
              height: "100%",
              borderRadius: "24px",
              overflow: "hidden",
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
              }}
            >
              <source src="/login-video.mp4" type="video/mp4" />
            </video>
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                background:
                  "linear-gradient(rgba(0,0,0,0) 40%, rgba(0,0,0,0.7) 100%)",
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: 40,
                left: 40,
                right: 40,
                color: "white",
                zIndex: 2,
              }}
            >
              <h1
                style={{
                  fontSize: "2.2rem",
                  fontWeight: 800,
                  marginBottom: 12,
                  lineHeight: 1.1,
                }}
              >
                Join the <br />
                Movement.
              </h1>
              <p
                style={{
                  fontSize: "0.95rem",
                  opacity: 0.9,
                  maxWidth: 320,
                  lineHeight: 1.5,
                }}
              >
                Access your dashboard to propose new initiatives and track
                community impact across Delhi.
              </p>
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div
          style={{
            flex: "1",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "48px",
          }}
        >
          <div style={{ maxWidth: "340px", width: "100%" }}>
            <div style={{ marginBottom: 32 }}>
              <h2
                style={{
                  fontSize: "1.7rem",
                  fontWeight: 800,
                  marginBottom: 8,
                  color: "#1a1a1a",
                }}
              >
                Sign In
              </h2>
              <p style={{ color: "#666", fontSize: "0.92rem" }}>
                Enter your credentials to continue
              </p>
            </div>

            <div
              style={{
                background: "rgba(232, 93, 38, 0.05)",
                border: "1px solid rgba(232, 93, 38, 0.1)",
                padding: "14px",
                borderRadius: "12px",
                marginBottom: 28,
              }}
            >
              <p
                style={{
                  fontSize: "0.8rem",
                  color: "var(--primary)",
                  fontWeight: 700,
                  marginBottom: 4,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Demo Credentials
              </p>
              <p style={{ fontSize: "0.88rem", color: "#444" }}>
                Email: <strong>demo@delhi.com</strong> <br /> Pass:{" "}
                <strong>delhi123</strong>
              </p>
            </div>

            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label
                  htmlFor="email"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: "0.88rem",
                    fontWeight: 600,
                    color: "#444",
                  }}
                >
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="name@example.com"
                  style={{
                    height: "48px",
                    borderRadius: "10px",
                    fontSize: "0.95rem",
                  }}
                />
              </div>

              <div className="form-group" style={{ marginTop: 20 }}>
                <label
                  htmlFor="password"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: "0.88rem",
                    fontWeight: 600,
                    color: "#444",
                  }}
                >
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  style={{
                    height: "48px",
                    borderRadius: "10px",
                    fontSize: "0.95rem",
                  }}
                />
              </div>

              <div
                style={{ textAlign: "right", marginTop: 12, marginBottom: 28 }}
              >
                <span
                  style={{
                    color: "var(--primary)",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Forgot password?
                </span>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-lg"
                style={{
                  width: "100%",
                  justifyContent: "center",
                  height: "52px",
                  borderRadius: "10px",
                  fontSize: "1rem",
                }}
                disabled={loading}
              >
                {loading ? (
                  "Signing in..."
                ) : (
                  <span
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    Sign In <ArrowRight size={18} />
                  </span>
                )}
              </button>
            </form>

            <p
              style={{
                textAlign: "center",
                marginTop: 28,
                fontSize: "0.92rem",
                color: "#666",
              }}
            >
              Don't have an account? <br />{" "}
              <Link
                to="/signup"
                style={{
                  color: "var(--primary)",
                  fontWeight: 700,
                  cursor: "pointer",
                  marginTop: 8,
                  display: "inline-block",
                  textDecoration: "none",
                }}
              >
                Create an Account
              </Link>
            </p>
          </div>
        </div>
      </div>

      <style>{`
        .login-video-side { display: flex; }
        @media (max-width: 900px) {
          .login-video-side { display: none !important; }
        }
      `}</style>
    </div>
  );
}

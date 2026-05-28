import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, User, ArrowRight } from "lucide-react";
import { loginUser } from "../store";

interface Props {
  addToast: (msg: string, type?: "success" | "error" | "info") => void;
}

export default function Signup({ addToast }: Props) {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Mock signup process
    setTimeout(() => {
      loginUser(email, name);
      addToast("Account created successfully!", "success");
      navigate("/submit");
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
        {/* Left Side - Video Section (Remains same as Login) */}
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
                Create your account to propose new initiatives and track
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
                Create Account
              </h2>
              <p style={{ color: "#666", fontSize: "0.92rem" }}>
                Join the Delhi's transformation journey
              </p>
            </div>

            <form onSubmit={handleSignup}>
              <div className="form-group">
                <label
                  htmlFor="name"
                  style={{
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    marginBottom: 8,
                    display: "block",
                    color: "#1a1a1a",
                  }}
                >
                  Full Name
                </label>
                <div style={{ position: "relative" }}>
                  <User
                    size={18}
                    style={{
                      position: "absolute",
                      left: 14,
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "#999",
                    }}
                  />
                  <input
                    type="text"
                    id="name"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    style={{
                      paddingLeft: 44,
                      height: 48,
                      borderRadius: 12,
                      background: "#f8f9fa",
                      border: "1.5px solid #eee",
                    }}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginTop: 16 }}>
                <label
                  htmlFor="email"
                  style={{
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    marginBottom: 8,
                    display: "block",
                    color: "#1a1a1a",
                  }}
                >
                  Email Address
                </label>
                <div style={{ position: "relative" }}>
                  <Mail
                    size={18}
                    style={{
                      position: "absolute",
                      left: 14,
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "#999",
                    }}
                  />
                  <input
                    type="email"
                    id="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={{
                      paddingLeft: 44,
                      height: 48,
                      borderRadius: 12,
                      background: "#f8f9fa",
                      border: "1.5px solid #eee",
                    }}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginTop: 16 }}>
                <label
                  htmlFor="password"
                  style={{
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    marginBottom: 8,
                    display: "block",
                    color: "#1a1a1a",
                  }}
                >
                  Password
                </label>
                <div style={{ position: "relative" }}>
                  <Lock
                    size={18}
                    style={{
                      position: "absolute",
                      left: 14,
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "#999",
                    }}
                  />
                  <input
                    type="password"
                    id="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{
                      paddingLeft: 44,
                      height: 48,
                      borderRadius: 12,
                      background: "#f8f9fa",
                      border: "1.5px solid #eee",
                    }}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                style={{
                  width: "100%",
                  height: 52,
                  borderRadius: 12,
                  marginTop: 32,
                  justifyContent: "center",
                  fontSize: "1rem",
                }}
              >
                {loading ? "Creating Account..." : "Create Account"}{" "}
                {!loading && <ArrowRight size={18} />}
              </button>
            </form>

            <div style={{ marginTop: 24, textAlign: "center" }}>
              <p style={{ fontSize: "0.92rem", color: "#666" }}>
                Already have an account?{" "}
                <Link
                  to="/login"
                  style={{
                    color: "var(--primary)",
                    fontWeight: 700,
                    textDecoration: "none",
                  }}
                >
                  Sign In
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

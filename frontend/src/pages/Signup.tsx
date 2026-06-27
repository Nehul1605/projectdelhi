import { useState } from "react";
import { useNavigate, Link, useSearchParams, useLocation } from "react-router-dom";
import { Mail, Lock, User, ArrowRight, Eye, EyeOff } from "lucide-react";
import { registerWithEmailPassword } from "../store";
import { LogoFull } from "../components/Logo";

interface Props {
  addToast: (msg: string, type?: "success" | "error" | "info") => void;
}

export default function Signup({ addToast }: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const state = location.state as { from?: string } | null;
  const redirectTo = state?.from || searchParams.get("redirectTo") || null;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await registerWithEmailPassword(name, email, password);
      addToast("Account created successfully!", "success");
      if (redirectTo) {
        navigate(redirectTo);
      } else {
        navigate("/submit");
      }
    } catch (err: any) {
      addToast(err.message || "Failed to create account", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "calc(100vh - 84px)",
        background: "var(--bg-warm)",
        padding: "40px 24px",
      }}
    >
      <div
        className="auth-container"
        style={{
          display: "flex",
          maxWidth: "1040px",
          width: "100%",
          background: "var(--bg-card)",
          borderRadius: "32px",
          overflow: "hidden",
          boxShadow: "var(--shadow-lg)",
          minHeight: "600px",
          border: "1px solid var(--border-light)",
        }}
      >
        {/* Left Side - Image Section (Floating look with padding) */}
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
            <img
              src="/login-bg.jpg"
              alt="Projectdelhi Initiative"
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "center",
              }}
            />
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
                bottom: 30,
                left: 30,
                right: 30,
                color: "white",
                zIndex: 2,
              }}
            >
              <h1
                style={{
                  fontSize: "2rem",
                  fontWeight: 800,
                  marginBottom: 10,
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
                  maxWidth: 360,
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
          className="auth-form-side"
          style={{
            flex: "1",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "48px",
          }}
        >
          <div style={{ maxWidth: "380px", width: "100%" }}>
            <div style={{ marginBottom: 24, textAlign: "center" }}>
              <h2
                style={{
                  fontSize: "1.7rem",
                  fontWeight: 800,
                  marginBottom: 8,
                  color: "var(--text)",
                }}
              >
                Create Account
              </h2>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.92rem" }}>
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
                    color: "var(--text-secondary)",
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
                      color: "var(--text-muted)",
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
                      background: "var(--bg)",
                      border: "1.5px solid var(--border)",
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
                    color: "var(--text-secondary)",
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
                      color: "var(--text-muted)",
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
                      background: "var(--bg)",
                      border: "1.5px solid var(--border)",
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
                    color: "var(--text-secondary)",
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
                      color: "var(--text-muted)",
                    }}
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{
                      paddingLeft: 44,
                      paddingRight: 44,
                      height: 48,
                      borderRadius: 12,
                      background: "var(--bg)",
                      border: "1.5px solid var(--border)",
                      width: "100%",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: "absolute",
                      right: "14px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--text-muted)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: 0,
                    }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
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
              <p style={{ fontSize: "0.92rem", color: "var(--text-secondary)" }}>
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

      <style>{`
        .login-video-side { display: flex; }
        @media (max-width: 900px) {
          .login-video-side { display: none !important; }
        }
      `}</style>
    </div>
  );
}

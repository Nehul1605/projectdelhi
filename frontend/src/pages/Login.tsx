import { useState, useEffect, useRef } from "react";
import { useNavigate, Link, useSearchParams, useLocation } from "react-router-dom";
import { ArrowRight, Lock, Eye, EyeOff, X } from "lucide-react";
import { loginWithEmailPassword, loginWithGoogle, forgotPassword } from "../store";
import { LogoFull } from "../components/Logo";
import { GoogleLogin } from "@react-oauth/google";


interface Props {
  addToast: (msg: string, type?: "success" | "error" | "info") => void;
}

export default function Login({ addToast }: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const state = location.state as { from?: string } | null;
  const redirectTo = state?.from || searchParams.get("redirectTo") || null;
  const messageShownRef = useRef(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [googleBtnWidth, setGoogleBtnWidth] = useState(380);

  useEffect(() => {
    const updateWidth = () => {
      const container = document.querySelector(".google-btn-container");
      if (container) {
        const width = Math.max(200, Math.min(380, container.clientWidth));
        setGoogleBtnWidth(width);
      } else {
        setGoogleBtnWidth(window.innerWidth < 480 ? 280 : 380);
      }
    };
    updateWidth();
    const timer = setTimeout(updateWidth, 100);
    window.addEventListener("resize", updateWidth);
    return () => {
      window.removeEventListener("resize", updateWidth);
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    const loginState = location.state as { from?: string; message?: string } | null;
    if (loginState?.message && !messageShownRef.current) {
      messageShownRef.current = true;
      addToast(loginState.message, "info");
      // Clean up the location state so the toast doesn't trigger again on component updates
      navigate(location.pathname, { replace: true, state: { from: loginState.from } });
    }
  }, [location.state, addToast, navigate, location.pathname]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const user = await loginWithEmailPassword(email, password);
      addToast(`Successfully logged in as ${user.role}!`, "success");

      if (redirectTo) {
        navigate(redirectTo);
      } else if (user.role === "ADMIN") {
        navigate("/admin");
      } else if (user.role === "MODERATOR") {
        navigate("/volunteer-dashboard");
      } else {
        navigate("/dashboard");
      }
    } catch (err: any) {
      addToast(err.message || "Failed to log in", "error");
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
                Access your dashboard to propose new initiatives and track
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
                Sign In
              </h2>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.92rem" }}>
                Enter your credentials to continue
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
                    color: "var(--text-secondary)",
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
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    style={{
                      paddingLeft: "44px",
                      paddingRight: "44px",
                      height: "48px",
                      borderRadius: "10px",
                      fontSize: "0.95rem",
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

              <div
                style={{ textAlign: "right", marginTop: 12, marginBottom: 28 }}
              >
                <span
                  onClick={() => setShowForgotModal(true)}
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

            <div style={{ margin: "24px 0", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
              <div style={{ flex: 1, height: "1px", background: "var(--border-light)" }}></div>
              <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500 }}>or</span>
              <div style={{ flex: 1, height: "1px", background: "var(--border-light)" }}></div>
            </div>

            <div style={{ display: "flex", justifyContent: "center", width: "100%" }} className="google-btn-container">
              <GoogleLogin
                onSuccess={async (credentialResponse) => {
                  if (credentialResponse.credential) {
                    try {
                      setLoading(true);
                      const user = await loginWithGoogle(credentialResponse.credential);
                      addToast(`Successfully logged in as ${user.role}!`, "success");
                      if (redirectTo) {
                        navigate(redirectTo);
                      } else if (user.role === "ADMIN") {
                        navigate("/admin");
                      } else if (user.role === "MODERATOR") {
                        navigate("/volunteer-dashboard");
                      } else {
                        navigate("/dashboard");
                      }
                    } catch (err: any) {
                      addToast(err.message || "Failed to log in with Google", "error");
                    } finally {
                      setLoading(false);
                    }
                  }
                }}
                onError={() => {
                  addToast("Google Authentication Failed", "error");
                }}
                theme="filled_blue"
                shape="pill"
                size="large"
                width={String(googleBtnWidth)}
              />
            </div>


            <p
              style={{
                textAlign: "center",
                marginTop: 28,
                fontSize: "0.92rem",
                color: "var(--text-secondary)",
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

      {showForgotModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(45, 32, 24, 0.4)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "var(--bg-card)",
              borderRadius: "24px",
              padding: "40px",
              maxWidth: "480px",
              width: "100%",
              boxShadow: "var(--shadow-lg)",
              border: "1px solid var(--border-light)",
              position: "relative",
            }}
          >
            <button
              onClick={() => {
                setShowForgotModal(false);
                setForgotEmail("");
              }}
              style={{
                position: "absolute",
                top: "20px",
                right: "20px",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--text-muted)",
                padding: "4px",
              }}
            >
              <X size={20} />
            </button>

            <div style={{ textAlign: "center", marginBottom: "28px" }}>
              <h3
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 800,
                  color: "var(--text)",
                  marginBottom: "8px",
                }}
              >
                Reset Password
              </h3>
              <p
                style={{
                  color: "var(--text-secondary)",
                  fontSize: "0.9rem",
                  lineHeight: 1.5,
                }}
              >
                Enter your registered email address and we'll send you
                instructions to reset your password.
              </p>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!forgotEmail) return;
                setForgotLoading(true);
                try {
                  const res = await forgotPassword(forgotEmail);
                  addToast(res.message, "success");
                  setShowForgotModal(false);
                  setForgotEmail("");
                } catch (err: any) {
                  addToast(err.message || "Failed to initiate password reset", "error");
                } finally {
                  setForgotLoading(false);
                }
              }}
            >
              <div className="form-group">
                <label
                  htmlFor="forgot-email"
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
                <input
                  type="email"
                  id="forgot-email"
                  placeholder="you@example.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  required
                  style={{
                    height: 48,
                    borderRadius: 12,
                    background: "var(--bg)",
                    border: "1.5px solid var(--border)",
                    width: "100%",
                    padding: "0 16px",
                  }}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={forgotLoading}
                style={{
                  width: "100%",
                  height: 52,
                  borderRadius: 12,
                  marginTop: "24px",
                  justifyContent: "center",
                  fontSize: "1rem",
                }}
              >
                {forgotLoading ? "Sending Instructions..." : "Send Reset Link"}
              </button>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .login-video-side { display: flex; }
        @media (max-width: 900px) {
          .login-video-side { display: none !important; }
        }
      `}</style>
    </div>
  );
}

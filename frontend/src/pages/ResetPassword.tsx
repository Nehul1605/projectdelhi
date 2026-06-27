import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import { resetPassword } from "../store";

interface Props {
  addToast: (msg: string, type?: "success" | "error" | "info") => void;
}

export default function ResetPassword({ addToast }: Props) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") || "";
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !token) {
      addToast("Invalid reset link. Missing email or token.", "error");
      return;
    }
    if (password !== confirmPassword) {
      addToast("Passwords do not match.", "error");
      return;
    }
    if (password.length < 6) {
      addToast("Password must be at least 6 characters.", "error");
      return;
    }

    setLoading(true);
    try {
      const res = await resetPassword(email, token, password);
      addToast(res.message, "success");
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err: any) {
      addToast(err.message || "Failed to reset password.", "error");
    } finally {
      setLoading(false);
    }
  };

  const isLinkInvalid = !email || !token;

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
        {/* Left Side - Image Section */}
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
                Secure your <br />
                Account.
              </h1>
              <p
                style={{
                  fontSize: "0.95rem",
                  opacity: 0.9,
                  maxWidth: 360,
                  lineHeight: 1.5,
                }}
              >
                Set a strong password for your account to resume tracking and
                proposing neighborhood updates.
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
                Reset Password
              </h2>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.92rem" }}>
                {isLinkInvalid
                  ? "This password reset link is invalid or expired"
                  : `Set new password for ${email}`}
              </p>
            </div>

            {isLinkInvalid ? (
              <div style={{ textAlign: "center", marginTop: 24 }}>
                <p style={{ color: "var(--danger)", marginBottom: 24, fontSize: "0.95rem" }}>
                  The link you followed to reset your password is invalid or has expired. Please request a new link from the login page.
                </p>
                <Link
                  to="/login"
                  className="btn btn-primary"
                  style={{
                    width: "100%",
                    height: 52,
                    borderRadius: 12,
                    justifyContent: "center",
                    textDecoration: "none",
                    display: "inline-flex",
                    alignItems: "center",
                  }}
                >
                  Back to Sign In
                </Link>
              </div>
            ) : (
              <form onSubmit={handleReset}>
                {/* New Password */}
                <div className="form-group">
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
                    New Password
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

                {/* Confirm Password */}
                <div className="form-group" style={{ marginTop: 16 }}>
                  <label
                    htmlFor="confirmPassword"
                    style={{
                      fontSize: "0.85rem",
                      fontWeight: 700,
                      marginBottom: 8,
                      display: "block",
                      color: "var(--text-secondary)",
                    }}
                  >
                    Confirm New Password
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
                      type={showConfirmPassword ? "text" : "password"}
                      id="confirmPassword"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
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
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
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
                  {loading ? "Resetting Password..." : "Reset Password"}{" "}
                  {!loading && <ArrowRight size={18} />}
                </button>
              </form>
            )}

            <div style={{ marginTop: 24, textAlign: "center" }}>
              <p style={{ fontSize: "0.92rem", color: "var(--text-secondary)" }}>
                Remember your password?{" "}
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

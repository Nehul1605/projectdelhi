import { useState } from "react";
import {
  CreditCard,
  QrCode,
  Building,
  ShieldCheck,
  Heart,
  ArrowRight,
  Copy,
  Check,
  Send,
  Loader2,
} from "lucide-react";
import { getCurrentUser, reportDonation } from "../store";

export default function Donate() {
  const [method, setMethod] = useState<"upi" | "bank" | "razorpay">("upi");
  const [subTab, setSubTab] = useState<"details" | "report">("details");
  const [copied, setCopied] = useState<string | null>(null);

  const handleSetMethod = (newMethod: "upi" | "bank" | "razorpay") => {
    setMethod(newMethod);
    setSubTab("details");
  };

  const currentUser = getCurrentUser();

  const [formName, setFormName] = useState(currentUser?.name || "");
  const [formEmail, setFormEmail] = useState(currentUser?.email || "");
  const [formPhone, setFormPhone] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formTxId, setFormTxId] = useState("");
  const [reporting, setReporting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState<boolean | null>(null);
  const [reportMsg, setReportMsg] = useState("");

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formEmail || !formPhone || !formAmount || !formTxId) {
      alert("Please fill in all fields.");
      return;
    }
    setReporting(true);
    setReportSuccess(null);
    
    const result = await reportDonation({
      name: formName,
      email: formEmail,
      phone: formPhone,
      amount: Number(formAmount),
      method,
      transactionId: formTxId
    });
    
    setReporting(false);
    setReportSuccess(result.success);
    setReportMsg(result.message);
    
    if (result.success) {
      setFormPhone("");
      setFormAmount("");
      setFormTxId("");
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const ReportForm = () => (
    <div style={{ textAlign: "left" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <h5 style={{ fontSize: "1.05rem", fontWeight: 700, margin: 0, color: "var(--text)" }}>
          Report Your Transfer
        </h5>
        <button
          type="button"
          onClick={() => setSubTab("details")}
          style={{
            background: "none",
            border: "none",
            color: "var(--primary)",
            fontSize: "0.85rem",
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "4px",
            padding: 0
          }}
        >
          &larr; View Details
        </button>
      </div>
      <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "16px" }}>
        Submitted details will be verified by our team, and your 80G tax receipt will be emailed within 24 hours.
      </p>

      {reportSuccess === true && (
        <div
          style={{
            background: "rgba(46, 125, 50, 0.1)",
            border: "1px solid rgba(46, 125, 50, 0.2)",
            color: "#2e7d32",
            padding: "12px",
            borderRadius: "8px",
            fontSize: "0.85rem",
            marginBottom: "16px"
          }}
        >
          {reportMsg}
        </div>
      )}

      {reportSuccess === false && (
        <div
          style={{
            background: "rgba(198, 40, 40, 0.1)",
            border: "1px solid rgba(198, 40, 40, 0.2)",
            color: "#c62828",
            padding: "12px",
            borderRadius: "8px",
            fontSize: "0.85rem",
            marginBottom: "16px"
          }}
        >
          {reportMsg}
        </div>
      )}

      <form onSubmit={handleReportSubmit} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 240px" }}>
            <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
              Full Name
            </label>
            <input
              type="text"
              required
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: "6px",
                border: "1px solid var(--border)",
                background: "var(--bg)",
                color: "var(--text)",
                fontSize: "0.85rem",
                boxSizing: "border-box"
              }}
            />
          </div>
          <div style={{ flex: "1 1 240px" }}>
            <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
              Email
            </label>
            <input
              type="email"
              required
              value={formEmail}
              onChange={(e) => setFormEmail(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: "6px",
                border: "1px solid var(--border)",
                background: "var(--bg)",
                color: "var(--text)",
                fontSize: "0.85rem",
                boxSizing: "border-box"
              }}
            />
          </div>
        </div>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 240px" }}>
            <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
              Phone Number
            </label>
            <input
              type="tel"
              required
              pattern="^\+?[0-9\s\-]+$"
              title="Please enter a valid phone number (digits, spaces, or leading +)"
              onKeyPress={(e) => {
                if (!/[0-9\s\-+]/.test(e.key)) {
                  e.preventDefault();
                }
              }}
              placeholder="e.g. +91 9999999999"
              value={formPhone}
              onChange={(e) => setFormPhone(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: "6px",
                border: "1px solid var(--border)",
                background: "var(--bg)",
                color: "var(--text)",
                fontSize: "0.85rem",
                boxSizing: "border-box"
              }}
            />
          </div>
          <div style={{ flex: "1 1 240px" }}>
            <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
              Amount (INR)
            </label>
            <input
              type="number"
              required
              min="1"
              onKeyPress={(e) => {
                if (!/[0-9]/.test(e.key)) {
                  e.preventDefault();
                }
              }}
              placeholder="e.g. 1000"
              value={formAmount}
              onChange={(e) => setFormAmount(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: "6px",
                border: "1px solid var(--border)",
                background: "var(--bg)",
                color: "var(--text)",
                fontSize: "0.85rem",
                boxSizing: "border-box"
              }}
            />
          </div>
        </div>

        <div>
          <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
            {method === "upi" ? "UPI Reference / Transaction ID" : "Bank UTR / Transaction Reference"}
          </label>
          <input
            type="text"
            required
            placeholder={method === "upi" ? "e.g. 628739330101" : "e.g. PUNBR52026..."}
            value={formTxId}
            onChange={(e) => setFormTxId(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 12px",
              borderRadius: "6px",
              border: "1px solid var(--border)",
              background: "var(--bg)",
              color: "var(--text)",
              fontSize: "0.85rem",
              boxSizing: "border-box"
            }}
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          disabled={reporting}
          style={{
            marginTop: "8px",
            width: "100%",
            justifyContent: "center",
            display: "flex",
            gap: "8px",
            alignItems: "center",
            padding: "10px"
          }}
        >
          {reporting ? (
            <>
              <Loader2 size={16} className="spinner" style={{ animation: "spin 1s linear infinite" }} /> Submitting...
            </>
          ) : (
            <>
              <Send size={16} /> Submit Payment Report
            </>
          )}
        </button>
      </form>
    </div>
  );

  return (
    <div className="container page-section">
      <div
        className="section-header"
        style={{ maxWidth: 800, margin: "0 auto 24px", textAlign: "center" }}
      >
        <h2 style={{ fontSize: "2rem", fontWeight: 800, marginBottom: "8px" }}>
          Support Projectdelhi
        </h2>
        <p style={{ fontSize: "0.95rem", color: "var(--text-secondary)", margin: "0 auto" }}>
          Your contributions fund community cleanups, education kits, and relief materials for those in need across the capital.
        </p>
      </div>

      <div
        style={{
          display: "flex",
          gap: "32px",
          maxWidth: "1000px",
          margin: "0 auto",
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        {/* Left: Donation Methods */}
        <div style={{ flex: "1", minWidth: "320px" }}>
          <div
            className="card"
            style={{ padding: "32px", borderRadius: "24px" }}
          >
            <h3
              style={{ marginBottom: 24, fontSize: "1.2rem", fontWeight: 700 }}
            >
              Choose Payment Method
            </h3>

            <div
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              <button
                onClick={() => handleSetMethod("upi")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                  padding: "16px",
                  borderRadius: "16px",
                  border:
                    method === "upi"
                      ? "2px solid var(--primary)"
                      : "1px solid var(--border)",
                  background:
                    method === "upi" ? "rgba(140, 36, 36, 0.05)" : "var(--bg-card)",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  textAlign: "left",
                }}
              >
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "12px",
                    background: "var(--bg)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: method === "upi" ? "var(--primary)" : "var(--text-muted)",
                  }}
                >
                  <QrCode size={24} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "1rem", color: "var(--text)" }}>
                    Scan & Pay (UPI)
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                    Instant pay via GPay, PhonePe, Paytm
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleSetMethod("razorpay")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                  padding: "16px",
                  borderRadius: "16px",
                  border:
                    method === "razorpay"
                      ? "2px solid var(--primary)"
                      : "1px solid var(--border)",
                  background:
                    method === "razorpay" ? "rgba(140, 36, 36, 0.05)" : "var(--bg-card)",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  textAlign: "left",
                }}
              >
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "12px",
                    background: "var(--bg)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: method === "razorpay" ? "var(--primary)" : "var(--text-muted)",
                  }}
                >
                  <CreditCard size={24} />
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontWeight: 700, fontSize: "1rem", color: "var(--text)" }}>
                      Cards / Netbanking
                    </span>
                    <span
                      style={{
                        fontSize: "0.65rem",
                        fontWeight: 700,
                        background: "rgba(140, 36, 36, 0.1)",
                        color: "var(--primary)",
                        padding: "2px 6px",
                        borderRadius: "4px",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      Soon
                    </span>
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                    Secure payment via Razorpay
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleSetMethod("bank")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                  padding: "16px",
                  borderRadius: "16px",
                  border:
                    method === "bank"
                      ? "2px solid var(--primary)"
                      : "1px solid var(--border)",
                  background:
                    method === "bank" ? "rgba(140, 36, 36, 0.05)" : "var(--bg-card)",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  textAlign: "left",
                }}
              >
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "12px",
                    background: "var(--bg)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: method === "bank" ? "var(--primary)" : "var(--text-muted)",
                  }}
                >
                  <Building size={24} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "1rem", color: "var(--text)" }}>
                    Bank Transfer (NEFT/IMPS)
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                    Direct transfer to NGO account
                  </div>
                </div>
              </button>
            </div>

            <div
              style={{
                marginTop: "32px",
                padding: "16px",
                background: "var(--bg-warm)",
                borderRadius: "12px",
                border: "1px dashed var(--border)",
                display: "flex",
                alignItems: "start",
                gap: "12px",
              }}
            >
              <ShieldCheck
                size={20}
                style={{ color: "var(--success)", marginTop: 2 }}
              />
              <p
                style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.5 }}
              >
                100% Secure. All donations are tax-exempt under Section 80G of
                the IT Act. Receipts will be sent to your email.
              </p>
            </div>
          </div>
        </div>

        {/* Right: Payment Details */}
        <div style={{ flex: "1", minWidth: "320px", display: "flex", flexDirection: "column", gap: "24px" }}>
          <div
            className="card"
            style={{
              padding: "40px",
              borderRadius: "24px",
              textAlign: "center",
              height: "auto",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            {(method === "upi" || method === "bank") && (
              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  background: "var(--bg)",
                  padding: "6px",
                  borderRadius: "14px",
                  border: "1px solid var(--border)",
                  marginBottom: "32px",
                }}
              >
                <button
                  type="button"
                  onClick={() => setSubTab("details")}
                  style={{
                    flex: 1,
                    padding: "10px 16px",
                    borderRadius: "10px",
                    border: "none",
                    background: subTab === "details" ? "var(--primary)" : "transparent",
                    color: subTab === "details" ? "#fff" : "var(--text-secondary)",
                    fontWeight: 600,
                    fontSize: "0.85rem",
                    cursor: "pointer",
                    transition: "all 0.25s ease",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                  }}
                >
                  {method === "upi" ? <QrCode size={16} /> : <Building size={16} />}
                  {method === "upi" ? "Scan QR Code" : "Account Details"}
                </button>
                <button
                  type="button"
                  onClick={() => setSubTab("report")}
                  style={{
                    flex: 1,
                    padding: "10px 16px",
                    borderRadius: "10px",
                    border: "none",
                    background: subTab === "report" ? "var(--primary)" : "transparent",
                    color: subTab === "report" ? "#fff" : "var(--text-secondary)",
                    fontWeight: 600,
                    fontSize: "0.85rem",
                    cursor: "pointer",
                    transition: "all 0.25s ease",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                  }}
                >
                  <Send size={16} />
                  Report Transfer
                </button>
              </div>
            )}

            {method === "upi" && subTab === "details" && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                {/* QR Code Card Frame */}
                <div
                  style={{
                    position: "relative",
                    width: "100%",
                    maxWidth: "290px",
                    background: "var(--bg-card)",
                    borderRadius: "20px",
                    padding: "6px",
                    boxShadow: "0 15px 35px rgba(0,0,0,0.08)",
                    border: "1px solid var(--border-light)",
                    transition: "transform 0.3s ease, box-shadow 0.3s ease",
                    cursor: "pointer",
                    overflow: "hidden",
                    marginBottom: "20px",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.boxShadow = "0 20px 40px rgba(0,0,0,0.12)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 15px 35px rgba(0,0,0,0.08)";
                  }}
                >
                  <img
                    src="/qr-code.png"
                    alt="Naksh Foundation UPI QR Code"
                    style={{
                      width: "100%",
                      height: "auto",
                      borderRadius: "14px",
                      display: "block",
                    }}
                  />
                </div>

                {/* Info and Copy Button */}
                <div style={{ width: "100%", maxWidth: "290px" }}>
                  <div
                    style={{
                      background: "var(--bg)",
                      borderRadius: "14px",
                      padding: "16px",
                      border: "1px solid var(--border)",
                      marginBottom: "16px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "6px"
                    }}
                  >
                    <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)" }}>
                      Merchant Account
                    </span>
                    <strong style={{ fontSize: "1.05rem", color: "var(--text)" }}>
                      Naksh Foundation
                    </strong>
                    <div
                      style={{
                        fontSize: "0.85rem",
                        color: "var(--primary)",
                        fontWeight: 600,
                        fontFamily: "monospace",
                        background: "rgba(140, 36, 36, 0.05)",
                        padding: "4px 10px",
                        borderRadius: "6px",
                        border: "1px solid rgba(140, 36, 36, 0.1)",
                        marginTop: "4px"
                      }}
                    >
                      8287393301-1@okbizaxis
                    </div>
                  </div>

                  <button
                    className="btn btn-secondary"
                    onClick={() => handleCopy("8287393301-1@okbizaxis", "vpa")}
                    style={{ width: "100%", justifyContent: "center", display: "flex", gap: "8px", alignItems: "center", marginBottom: "16px" }}
                  >
                    {copied === "vpa" ? (
                      <>
                        <Check size={18} /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy size={18} /> Copy UPI ID
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => setSubTab("report")}
                    style={{
                      width: "100%",
                      justifyContent: "center",
                      display: "flex",
                      gap: "8px",
                      alignItems: "center",
                      padding: "12px",
                    }}
                  >
                    I Have Transferred - Report Now <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}

             {method === "razorpay" && (
              <div style={{ padding: "20px 0" }}>
                <CreditCard
                  size={64}
                  style={{
                    color: "var(--primary)",
                    opacity: 0.3,
                    marginBottom: 24,
                  }}
                />
                <h4
                  style={{
                    fontSize: "1.4rem",
                    fontWeight: 800,
                    marginBottom: 12,
                  }}
                >
                  Pay via Razorpay
                </h4>
                <div
                  style={{
                    display: "inline-block",
                    background: "rgba(140, 36, 36, 0.08)",
                    color: "var(--primary)",
                    padding: "4px 12px",
                    borderRadius: "20px",
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    marginBottom: 20
                  }}
                >
                  Coming Soon
                </div>
                <p style={{ color: "var(--text-secondary)", marginBottom: 32, fontSize: "0.95rem", lineHeight: 1.6 }}>
                  Securely donate using Credit/Debit Cards, Netbanking, or
                  Wallets. This payment method is currently undergoing integration and will be active shortly. In the meantime, please support us using <strong>Scan & Pay (UPI)</strong> or <strong>Bank Transfer</strong>.
                </p>
                <button
                  className="btn btn-secondary btn-lg"
                  style={{ width: "100%", justifyContent: "center", cursor: "not-allowed" }}
                  disabled
                >
                  Feature Coming Soon
                </button>
              </div>
            )}

            {method === "bank" && subTab === "details" && (
              <div style={{ textAlign: "left" }}>
                <h4
                  style={{
                    fontSize: "1.2rem",
                    fontWeight: 800,
                    marginBottom: 20,
                    textAlign: "center",
                  }}
                >
                  Account Details
                </h4>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px",
                  }}
                >
                  {[
                    {
                      label: "Account Name",
                      value: "NAKSH FOUNDATION",
                    },
                    { label: "Account Number", value: "1887202100000555" },
                    { label: "Bank Name", value: "PUNJAB NATIONAL BANK" },
                    { label: "IFSC Code", value: "PUNB0188720" },
                    { label: "Branch", value: "RAMGANJ BAZAR" },
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        paddingBottom: "12px",
                        borderBottom: "1px solid var(--border-light)",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "0.75rem",
                          color: "var(--text-muted)",
                          fontWeight: 600,
                          textTransform: "uppercase",
                          marginBottom: 2,
                        }}
                      >
                        {item.label}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <span style={{ fontWeight: 600, color: "var(--text)" }}>
                          {item.value}
                        </span>
                        <button
                          onClick={() => handleCopy(item.value, item.label)}
                          style={{
                            border: "none",
                            background: "none",
                            cursor: "pointer",
                            color: copied === item.label ? "var(--success)" : "var(--text-muted)",
                          }}
                        >
                          {copied === item.label ? (
                            <Check size={16} />
                          ) : (
                            <Copy size={16} />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setSubTab("report")}
                  style={{
                    marginTop: "28px",
                    width: "100%",
                    justifyContent: "center",
                    display: "flex",
                    gap: "8px",
                    alignItems: "center",
                    padding: "12px",
                  }}
                >
                  I Have Transferred - Report Now <ArrowRight size={16} />
                </button>
              </div>
            )}

            {(method === "upi" || method === "bank") && subTab === "report" && (
              <ReportForm />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

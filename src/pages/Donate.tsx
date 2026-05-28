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
} from "lucide-react";

export default function Donate() {
  const [method, setMethod] = useState<"upi" | "bank" | "razorpay">("upi");
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="container page-section">
      <div
        className="section-header"
        style={{ maxWidth: 800, margin: "0 auto 48px" }}
      >
        <div
          style={{
            display: "inline-flex",
            padding: "12px",
            background: "rgba(232, 93, 38, 0.1)",
            color: "var(--primary)",
            borderRadius: "50%",
            marginBottom: 16,
          }}
        >
          <Heart size={32} fill="currentColor" />
        </div>
        <h2 style={{ fontSize: "2.5rem", fontWeight: 800 }}>
          Support Project Delhi
        </h2>
        <p style={{ fontSize: "1.1rem" }}>
          Your contributions directly fund community cleanups, education kits,
          and relief materials for those in need across the capital.
        </p>
      </div>

      <div
        style={{
          display: "flex",
          gap: "32px",
          maxWidth: "1000px",
          margin: "0 auto",
          flexWrap: "wrap",
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
                onClick={() => setMethod("upi")}
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
                    method === "upi" ? "rgba(232, 93, 38, 0.05)" : "white",
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
                    background: "#f8f9fa",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: method === "upi" ? "var(--primary)" : "#666",
                  }}
                >
                  <QrCode size={24} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "1rem" }}>
                    Scan & Pay (UPI)
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "#666" }}>
                    Instant pay via GPay, PhonePe, Paytm
                  </div>
                </div>
              </button>

              <button
                onClick={() => setMethod("razorpay")}
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
                    method === "razorpay" ? "rgba(232, 93, 38, 0.05)" : "white",
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
                    background: "#f8f9fa",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: method === "razorpay" ? "var(--primary)" : "#666",
                  }}
                >
                  <CreditCard size={24} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "1rem" }}>
                    Cards / Netbanking
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "#666" }}>
                    Secure payment via Razorpay
                  </div>
                </div>
              </button>

              <button
                onClick={() => setMethod("bank")}
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
                    method === "bank" ? "rgba(232, 93, 38, 0.05)" : "white",
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
                    background: "#f8f9fa",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: method === "bank" ? "var(--primary)" : "#666",
                  }}
                >
                  <Building size={24} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "1rem" }}>
                    Bank Transfer (NEFT/IMPS)
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "#666" }}>
                    Direct transfer to NGO account
                  </div>
                </div>
              </button>
            </div>

            <div
              style={{
                marginTop: "32px",
                padding: "16px",
                background: "#fcfcfc",
                borderRadius: "12px",
                border: "1px dashed var(--border)",
                display: "flex",
                alignItems: "start",
                gap: "12px",
              }}
            >
              <ShieldCheck
                size={20}
                style={{ color: "#27ae60", marginTop: 2 }}
              />
              <p
                style={{ fontSize: "0.85rem", color: "#555", lineHeight: 1.5 }}
              >
                100% Secure. All donations are tax-exempt under Section 80G of
                the IT Act. Receipts will be sent to your email.
              </p>
            </div>
          </div>
        </div>

        {/* Right: Payment Details */}
        <div style={{ flex: "1", minWidth: "320px" }}>
          <div
            className="card"
            style={{
              padding: "40px",
              borderRadius: "24px",
              textAlign: "center",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            {method === "upi" && (
              <>
                <div
                  style={{
                    width: "240px",
                    height: "240px",
                    background: "white",
                    margin: "0 auto 24px",
                    borderRadius: "24px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "2px solid var(--primary-light)",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
                    overflow: "hidden",
                  }}
                >
                  <img
                    src="/qr-code.png"
                    alt="Donate via UPI"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                      padding: "10px",
                    }}
                  />
                </div>
                <h4
                  style={{
                    fontSize: "1.2rem",
                    fontWeight: 700,
                    marginBottom: 8,
                  }}
                >
                  VPA: projectdelhi@icici
                </h4>
                <p
                  style={{
                    color: "#666",
                    fontSize: "0.9rem",
                    marginBottom: 24,
                  }}
                >
                  Scan this QR code using any UPI app to donate
                </p>
                <button
                  className="btn btn-secondary"
                  onClick={() => handleCopy("projectdelhi@icici", "vpa")}
                  style={{ width: "100%", justifyContent: "center" }}
                >
                  {copied === "vpa" ? (
                    <>
                      <Check size={18} /> Copied
                    </>
                  ) : (
                    <>
                      <Copy size={18} /> Copy UPI ID
                    </>
                  )}
                </button>
              </>
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
                <p style={{ color: "#666", marginBottom: 32 }}>
                  Securely donate using Credit/Debit Cards, Netbanking, or
                  Wallets.
                </p>
                <button
                  className="btn btn-primary btn-lg"
                  style={{ width: "100%", justifyContent: "center" }}
                >
                  Proceed to Payment <ArrowRight size={20} />
                </button>
              </div>
            )}

            {method === "bank" && (
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
                      value: "Project Delhi Foundation",
                    },
                    { label: "Account Number", value: "000705001234" },
                    { label: "Bank Name", value: "ICICI Bank" },
                    { label: "IFSC Code", value: "ICIC0000007" },
                    { label: "Branch", value: "Connaught Place, New Delhi" },
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        paddingBottom: "12px",
                        borderBottom: "1px solid #f0f0f0",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "0.75rem",
                          color: "#999",
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
                        <span style={{ fontWeight: 600, color: "#333" }}>
                          {item.value}
                        </span>
                        <button
                          onClick={() => handleCopy(item.value, item.label)}
                          style={{
                            border: "none",
                            background: "none",
                            cursor: "pointer",
                            color: copied === item.label ? "#27ae60" : "#ccc",
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
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

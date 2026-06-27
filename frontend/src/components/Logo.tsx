import React from "react";

export interface LogoProps {
  size?: number;
  className?: string;
}

export function LogoIcon({ size = 48, className = "" }: LogoProps) {
  return (
    <img
      src="/logo.png"
      alt="projectdelhi.org Logo"
      width={size}
      height={size}
      style={{
        width: size,
        height: size,
        objectFit: "contain",
        borderRadius: "50%",
        display: "inline-block",
        verticalAlign: "middle",
      }}
      className={className}
    />
  );
}

export function LogoFull({ size = 48, className = "" }: LogoProps) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "8px",
        textAlign: "left",
      }}
      className={className}
    >
      <LogoIcon size={size} />
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
        <span
          style={{
            fontFamily: "var(--font)",
            fontSize: `${(size / 48) * 1.35}rem`,
            fontWeight: 800,
            color: "#8c2424",
            lineHeight: 1.05,
            letterSpacing: "-0.5px",
            textAlign: "center",
          }}
        >
          projectdelhi<span style={{ color: "var(--terracotta)", fontWeight: 700 }}>.org</span>
        </span>
        <div
          className="logo-subtitle"
          style={{
            display: "flex",
            alignItems: "center",
            width: "100%",
            gap: "8px",
            marginTop: "4px",
          }}
        >
          <div style={{ flex: 1, height: "1px", background: "var(--text-secondary)", opacity: 0.25 }} />
          <span
            style={{
              fontFamily: "var(--font)",
              fontSize: `${(size / 48) * 0.44}rem`,
              fontWeight: 700,
              color: "var(--text-secondary)",
              letterSpacing: "0.8px",
              lineHeight: 1.3,
              whiteSpace: "nowrap",
              textTransform: "uppercase",
            }}
          >
            Together for a Better Delhi
          </span>
          <div style={{ flex: 1, height: "1px", background: "var(--text-secondary)", opacity: 0.25 }} />
        </div>
      </div>
    </div>
  );
}

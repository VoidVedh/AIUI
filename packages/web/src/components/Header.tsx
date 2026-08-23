import React from "react";
import { Sparkles, Cpu, Layers, Github } from "lucide-react";

interface HeaderProps {
  serverStatus: "connected" | "disconnected" | "running";
}

export const Header: React.FC<HeaderProps> = ({ serverStatus }) => {
  return (
    <header className="top-navbar">
      <div className="brand-badge">
        <div className="brand-logo-icon">
          <Sparkles size={20} />
        </div>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span className="brand-title">AIUI</span>
            <span className="brand-tag">AUTONOMOUS AGENT</span>
          </div>
          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>
            Deterministic UI-to-Code Engineering & Self-Correction Engine
          </p>
        </div>
      </div>

      <div className="nav-actions">
        <div className="status-pill">
          <span
            className="status-dot"
            style={{
              background:
                serverStatus === "running"
                  ? "#3b82f6"
                  : serverStatus === "connected"
                  ? "#10b981"
                  : "#ef4444",
              boxShadow:
                serverStatus === "running"
                  ? "0 0 10px #3b82f6"
                  : serverStatus === "connected"
                  ? "0 0 10px #10b981"
                  : "0 0 10px #ef4444",
            }}
          />
          <span>
            {serverStatus === "running"
              ? "Pipeline Running"
              : serverStatus === "connected"
              ? "Engine Online (Chromium & Vite)"
              : "Engine Offline"}
          </span>
        </div>

        <div className="status-pill" style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem" }}>
          <Cpu size={14} style={{ color: "var(--color-primary)" }} />
          <span>React 19 / Playwright</span>
        </div>
      </div>
    </header>
  );
};

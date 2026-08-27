import React from "react";
import { Sparkles, Cpu, Activity, ShieldCheck } from "lucide-react";

interface HeaderProps {
  serverStatus: "connected" | "disconnected" | "running";
  threshold: number;
}

export const Header: React.FC<HeaderProps> = ({ serverStatus, threshold }) => {
  return (
    <header className="studio-navbar">
      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
        <div
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "10px",
            background: "linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 16px rgba(59, 130, 246, 0.35)",
          }}
        >
          <Sparkles size={18} color="#FFFFFF" />
        </div>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <h1 style={{ fontSize: "16px", fontWeight: 700, letterSpacing: "-0.02em" }}>
              AIUI Studio
            </h1>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                padding: "2px 8px",
                borderRadius: "9999px",
                background: "rgba(99, 102, 241, 0.12)",
                border: "1px solid rgba(99, 102, 241, 0.3)",
                fontSize: "11px",
                fontWeight: 600,
                color: "#A5B4FC",
              }}
            >
              <Cpu size={12} />
              React 19 Engine
            </span>
          </div>
          <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "1px" }}>
            Autonomous Screenshot-to-React Synthesis & Self-Correction
          </p>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        {/* Target Fidelity Threshold */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "5px 10px",
            background: "var(--bg-surface-elevated)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-sm)",
            fontSize: "12px",
            color: "var(--text-secondary)",
          }}
        >
          <ShieldCheck size={14} color="#60A5FA" />
          <span>Target:</span>
          <strong style={{ color: "var(--text-primary)" }}>{(threshold * 100).toFixed(0)}% MSSIM</strong>
        </div>

        {/* Server Status Indicator */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "5px 10px",
            background: "var(--bg-surface-elevated)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-sm)",
            fontSize: "12px",
          }}
        >
          <span
            style={{
              width: "7px",
              height: "7px",
              borderRadius: "50%",
              backgroundColor:
                serverStatus === "connected"
                  ? "var(--color-success)"
                  : serverStatus === "running"
                  ? "var(--color-primary)"
                  : "var(--color-error)",
              boxShadow:
                serverStatus === "connected"
                  ? "0 0 6px var(--color-success)"
                  : serverStatus === "running"
                  ? "0 0 6px var(--color-primary)"
                  : "0 0 6px var(--color-error)",
            }}
          />
          <span style={{ color: "var(--text-secondary)", textTransform: "capitalize" }}>
            {serverStatus === "running" ? "Synthesizing" : serverStatus}
          </span>
        </div>
      </div>
    </header>
  );
};

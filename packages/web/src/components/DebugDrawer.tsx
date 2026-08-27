import React, { useState } from "react";
import { Terminal, ChevronUp, ChevronDown, Activity, Cpu, Sparkles } from "lucide-react";

interface DebugDrawerProps {
  logs: string[];
  history: Array<{
    iteration: number;
    similarityScore: number;
    ssimScore?: number;
    pixelMatchScore?: number;
    layoutIouScore?: number;
  }>;
}

export const DebugDrawer: React.FC<DebugDrawerProps> = ({ logs, history }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<"logs" | "history">("logs");

  return (
    <div
      className="debug-drawer"
      style={{
        transform: isOpen ? "translateY(0)" : "translateY(calc(100% - 40px))",
      }}
    >
      <div className="debug-drawer-header" onClick={() => setIsOpen(!isOpen)}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Terminal size={14} color="#60A5FA" />
          <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)" }}>
            Engine Console & Convergence Telemetry
          </span>
          <span
            style={{
              fontSize: "11px",
              padding: "1px 6px",
              borderRadius: "4px",
              background: "var(--bg-surface-elevated)",
              color: "var(--text-muted)",
              fontFamily: "var(--font-mono)",
            }}
          >
            {logs.length} logs
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{ display: "flex", gap: "4px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => { setActiveSubTab("logs"); setIsOpen(true); }}
              style={{
                background: activeSubTab === "logs" ? "var(--bg-surface-elevated)" : "transparent",
                border: "none",
                borderRadius: "4px",
                padding: "3px 8px",
                color: activeSubTab === "logs" ? "#FFFFFF" : "var(--text-muted)",
                fontSize: "11px",
                cursor: "pointer",
              }}
            >
              Console Stream
            </button>
            <button
              onClick={() => { setActiveSubTab("history"); setIsOpen(true); }}
              style={{
                background: activeSubTab === "history" ? "var(--bg-surface-elevated)" : "transparent",
                border: "none",
                borderRadius: "4px",
                padding: "3px 8px",
                color: activeSubTab === "history" ? "#FFFFFF" : "var(--text-muted)",
                fontSize: "11px",
                cursor: "pointer",
              }}
            >
              Convergence History ({history.length})
            </button>
          </div>

          {isOpen ? <ChevronDown size={16} color="var(--text-secondary)" /> : <ChevronUp size={16} color="var(--text-secondary)" />}
        </div>
      </div>

      {isOpen && (
        <div className="debug-drawer-body">
          {activeSubTab === "logs" && (
            <div>
              {logs.map((line, idx) => {
                let cls = "log-line";
                if (line.includes("[PROGRESS]")) cls += " progress";
                if (line.includes("[EVALUATING]")) cls += " evaluating";
                if (line.includes("[CORRECTING]")) cls += " correcting";
                if (line.includes("[ERROR]") || line.includes("failed")) cls += " error";

                return (
                  <div key={idx} className={cls}>
                    {line}
                  </div>
                );
              })}
            </div>
          )}

          {activeSubTab === "history" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "12px" }}>
              {history.map((h) => (
                <div
                  key={h.iteration}
                  style={{
                    background: "var(--bg-surface)",
                    padding: "12px",
                    borderRadius: "6px",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>Iteration {h.iteration}</span>
                    <strong style={{ color: "#34D399" }}>{(h.similarityScore * 100).toFixed(1)}%</strong>
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)", display: "flex", flexDirection: "column", gap: "2px" }}>
                    <span>MSSIM: {((h.ssimScore || 0) * 100).toFixed(1)}%</span>
                    <span>PixelMatch: {((h.pixelMatchScore || 0) * 100).toFixed(1)}%</span>
                    <span>LayoutIoU: {(h.layoutIouScore || 1).toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

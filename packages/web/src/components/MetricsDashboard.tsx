import React from "react";
import { Scale, CheckCircle, TrendingUp, Layers, BoxSelect } from "lucide-react";

export interface IterationCheckpointData {
  iteration: number;
  similarityScore: number;
  ssimScore: number;
  pixelMatchScore: number;
  layoutIouScore: number;
}

interface MetricsDashboardProps {
  currentScore: number;
  targetThreshold: number;
  ssimScore: number;
  pixelMatchScore: number;
  layoutIouScore: number;
  history: IterationCheckpointData[];
}

export const MetricsDashboard: React.FC<MetricsDashboardProps> = ({
  currentScore,
  targetThreshold,
  ssimScore,
  pixelMatchScore,
  layoutIouScore,
  history,
}) => {
  const percentage = Math.round(currentScore * 100);
  const isPassed = currentScore >= targetThreshold;

  // Determine meter color
  const color = isPassed
    ? "var(--color-success)"
    : currentScore >= 0.85
    ? "var(--color-primary)"
    : currentScore >= 0.70
    ? "var(--color-warning)"
    : "var(--color-error)";

  const circumference = 2 * Math.PI * 54;
  const strokeDashoffset = circumference - (currentScore * circumference);

  return (
    <div className="glass-panel" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h3>Visual Fidelity Metrics & Convergence</h3>
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
            Deterministic evaluation formula: MSSIM (45%) + PixelMatch (35%) + Layout IOU (20%).
          </p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: "24px", alignItems: "center" }}>
        {/* Radial Meter */}
        <div className="similarity-radial-wrap">
          <div style={{ position: "relative", width: "130px", height: "130px" }}>
            <svg width="130" height="130" viewBox="0 0 130 130">
              <circle
                cx="65"
                cy="65"
                r="54"
                fill="none"
                stroke="var(--bg-surface-elevated)"
                strokeWidth="10"
              />
              <circle
                cx="65"
                cy="65"
                r="54"
                fill="none"
                stroke={color}
                strokeWidth="10"
                strokeDasharray={circumference}
                strokeDashoffset={isNaN(strokeDashoffset) ? circumference : strokeDashoffset}
                strokeLinecap="round"
                transform="rotate(-90 65 65)"
                style={{ transition: "stroke-dashoffset 0.5s ease" }}
              />
            </svg>
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span style={{ fontSize: "1.75rem", fontWeight: 800, fontFamily: "var(--font-display)", color }}>
                {percentage}%
              </span>
              <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Fidelity
              </span>
            </div>
          </div>

          <div style={{ marginTop: "12px", textAlign: "center" }}>
            <span
              style={{
                fontSize: "0.75rem",
                fontWeight: 600,
                padding: "3px 10px",
                borderRadius: "9999px",
                background: isPassed ? "rgba(16, 185, 129, 0.15)" : "rgba(59, 130, 246, 0.15)",
                color: isPassed ? "var(--color-success)" : "var(--color-primary)",
                border: `1px solid ${isPassed ? "rgba(16, 185, 129, 0.3)" : "rgba(59, 130, 246, 0.3)"}`,
              }}
            >
              {isPassed ? "✓ Target Threshold Met" : `Target: ${(targetThreshold * 100).toFixed(0)}%`}
            </span>
          </div>
        </div>

        {/* Breakdown Metric Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
          <div className="metric-card">
            <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-muted)", fontSize: "0.75rem" }}>
              <Scale size={14} style={{ color: "var(--color-primary)" }} />
              <span>MSSIM (45%)</span>
            </div>
            <div className="metric-val" style={{ color: "#ffffff" }}>
              {(ssimScore * 100).toFixed(1)}%
            </div>
            <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Structural Luminance & Contrast</span>
          </div>

          <div className="metric-card">
            <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-muted)", fontSize: "0.75rem" }}>
              <Layers size={14} style={{ color: "var(--color-secondary)" }} />
              <span>PixelMatch (35%)</span>
            </div>
            <div className="metric-val" style={{ color: "#ffffff" }}>
              {(pixelMatchScore * 100).toFixed(1)}%
            </div>
            <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Raw Delta Pixel Ratio</span>
          </div>

          <div className="metric-card">
            <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-muted)", fontSize: "0.75rem" }}>
              <BoxSelect size={14} style={{ color: "var(--color-success)" }} />
              <span>Layout IOU (20%)</span>
            </div>
            <div className="metric-val" style={{ color: "#ffffff" }}>
              {(layoutIouScore * 100).toFixed(1)}%
            </div>
            <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Spatial Element Alignment</span>
          </div>
        </div>
      </div>

      {/* Iteration Progression History */}
      {history.length > 0 && (
        <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "16px" }}>
          <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "10px", display: "flex", alignItems: "center", gap: "6px" }}>
            <TrendingUp size={14} />
            <span>Iteration Convergence History</span>
          </div>

          <div style={{ display: "flex", gap: "10px", overflowX: "auto", paddingBottom: "6px" }}>
            {history.map((h, i) => (
              <div
                key={i}
                style={{
                  minWidth: "120px",
                  padding: "10px 14px",
                  background: "var(--bg-surface-elevated)",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "2px" }}>
                  Iteration {h.iteration || i + 1}
                </div>
                <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--color-primary)" }}>
                  {(h.similarityScore * 100).toFixed(1)}%
                </div>
                <div style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>
                  SSIM: {(h.ssimScore * 100).toFixed(0)}% • Pix: {(h.pixelMatchScore * 100).toFixed(0)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

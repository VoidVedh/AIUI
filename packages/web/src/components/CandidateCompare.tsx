import React from "react";
import type { ModelCandidate } from "@aiui/orchestrator";
import { Trophy, CheckCircle2, Layers, AlertCircle, Sparkles } from "lucide-react";

export interface CandidateCompareProps {
  candidates: ModelCandidate[];
  selectedCandidateId?: string | null;
  runId?: string | null;
  isAnalyzing?: boolean;
}

export const CandidateCompare: React.FC<CandidateCompareProps> = ({
  candidates,
  selectedCandidateId,
  runId,
  isAnalyzing = false,
}) => {
  if (candidates.length === 0) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "48px 24px",
          textAlign: "center",
          height: "100%",
        }}
      >
        {isAnalyzing ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
            <div className="pulse-dot" style={{ width: "16px", height: "16px" }} />
            <h4 style={{ fontSize: "16px", color: "var(--text-primary)", fontWeight: 600 }}>
              Multi-Model Race In Progress...
            </h4>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", maxWidth: "420px" }}>
              Generating and evaluating UI candidates in parallel across selected models. Real-time metrics will appear as each candidate renders.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
            <AlertCircle size={36} color="#F87171" style={{ opacity: 0.8 }} />
            <h4 style={{ fontSize: "16px", color: "var(--text-primary)", fontWeight: 600 }}>
              No Candidate Results Available
            </h4>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", maxWidth: "440px" }}>
              All race candidates either failed or were excluded due to unconfigured API keys. Deterministic fallback pipeline was engaged.
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", height: "100%", padding: "20px", overflow: "auto" }}>
      {/* Race Header Banner */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "rgba(59, 130, 246, 0.08)",
          border: "1px solid rgba(59, 130, 246, 0.25)",
          borderRadius: "var(--radius-md)",
          padding: "12px 16px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Trophy size={18} color="#FBBF24" />
          <div>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)" }}>
              Multi-Model Race Evaluation ({candidates.length} Candidate{candidates.length > 1 ? "s" : ""})
            </div>
            <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
              Candidates evaluated in parallel with Promise.allSettled. Highest initial composite score auto-selected.
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Selection mode:</span>
          <span
            style={{
              fontSize: "11px",
              fontWeight: 600,
              padding: "2px 8px",
              borderRadius: "12px",
              background: "rgba(16, 185, 129, 0.15)",
              color: "#34D399",
              border: "1px solid rgba(16, 185, 129, 0.3)",
            }}
          >
            Auto-Selected Winner
          </span>
        </div>
      </div>

      {/* Candidate Cards Grid (1 to 3 columns) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${Math.min(candidates.length, 3)}, minmax(260px, 1fr))`,
          gap: "16px",
          flex: 1,
        }}
      >
        {candidates.map((candidate, idx) => {
          const isWinner = candidate.selected || candidate.id === selectedCandidateId || idx === 0;
          const previewSrc = candidate.previewArtifactPath && runId
            ? `/api/runs/${runId}/artifacts/candidate_${candidate.provider}.png`
            : null;

          return (
            <div
              key={candidate.id || candidate.provider}
              style={{
                display: "flex",
                flexDirection: "column",
                background: isWinner ? "rgba(16, 185, 129, 0.05)" : "var(--bg-surface)",
                border: isWinner
                  ? "2px solid #10B981"
                  : "1px solid var(--border-medium)",
                borderRadius: "var(--radius-lg)",
                overflow: "hidden",
                boxShadow: isWinner
                  ? "0 0 20px rgba(16, 185, 129, 0.15), 0 8px 16px rgba(0,0,0,0.4)"
                  : "0 4px 12px rgba(0,0,0,0.3)",
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
              }}
            >
              {/* Card Header */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "12px 14px",
                  background: isWinner ? "rgba(16, 185, 129, 0.12)" : "rgba(255, 255, 255, 0.03)",
                  borderBottom: "1px solid var(--border-subtle)",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <strong style={{ fontSize: "14px", color: "var(--text-primary)", textTransform: "capitalize" }}>
                      {candidate.provider}
                    </strong>
                    {isWinner && (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "3px",
                          fontSize: "10px",
                          fontWeight: 700,
                          padding: "2px 6px",
                          borderRadius: "10px",
                          background: "#10B981",
                          color: "#FFFFFF",
                          letterSpacing: "0.03em",
                        }}
                      >
                        <Trophy size={10} /> WINNER
                      </span>
                    )}
                  </div>
                  <span
                    style={{
                      fontSize: "11px",
                      color: "var(--text-muted)",
                      display: "block",
                      marginTop: "1px",
                      maxWidth: "200px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {candidate.model || candidate.provider}
                  </span>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div
                    style={{
                      fontSize: "16px",
                      fontWeight: 800,
                      color: isWinner ? "#34D399" : "var(--color-primary)",
                      fontFamily: "monospace",
                    }}
                  >
                    {(candidate.initialScore * 100).toFixed(1)}%
                  </div>
                  <span style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase" }}>
                    Composite
                  </span>
                </div>
              </div>

              {/* Preview Thumbnail Container */}
              <div
                style={{
                  height: "220px",
                  background: "#090D16",
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  borderBottom: "1px solid var(--border-subtle)",
                }}
              >
                {previewSrc ? (
                  <img
                    src={previewSrc}
                    alt={`Candidate ${candidate.provider} preview`}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                      display: "block",
                    }}
                    onError={(e) => {
                      // Fallback if artifact image not loaded yet
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                ) : (
                  <div style={{ textAlign: "center", color: "var(--text-muted)" }}>
                    <Layers size={32} style={{ opacity: 0.3, marginBottom: "6px" }} />
                    <p style={{ fontSize: "12px" }}>Preview Sandbox Render</p>
                  </div>
                )}
              </div>

              {/* Metrics Breakdown */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: "8px",
                  padding: "12px 14px",
                  background: "var(--bg-surface-elevated)",
                }}
              >
                <div
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    borderRadius: "var(--radius-sm)",
                    padding: "8px 6px",
                    textAlign: "center",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  <div style={{ fontSize: "10px", color: "var(--text-muted)", marginBottom: "2px" }}>
                    MSSIM (45%)
                  </div>
                  <strong style={{ fontSize: "12px", color: "var(--text-primary)" }}>
                    {(candidate.ssimScore * 100).toFixed(1)}%
                  </strong>
                </div>

                <div
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    borderRadius: "var(--radius-sm)",
                    padding: "8px 6px",
                    textAlign: "center",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  <div style={{ fontSize: "10px", color: "var(--text-muted)", marginBottom: "2px" }}>
                    Pixel (35%)
                  </div>
                  <strong style={{ fontSize: "12px", color: "var(--text-primary)" }}>
                    {(candidate.pixelMatchScore * 100).toFixed(1)}%
                  </strong>
                </div>

                <div
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    borderRadius: "var(--radius-sm)",
                    padding: "8px 6px",
                    textAlign: "center",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  <div style={{ fontSize: "10px", color: "var(--text-muted)", marginBottom: "2px" }}>
                    IoU (20%)
                  </div>
                  <strong style={{ fontSize: "12px", color: "var(--text-primary)" }}>
                    {candidate.layoutIouScore.toFixed(2)}
                  </strong>
                </div>
              </div>

              {/* Card Footer Status */}
              <div
                style={{
                  marginTop: "auto",
                  padding: "8px 14px",
                  fontSize: "11px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderTop: "1px solid var(--border-subtle)",
                  color: isWinner ? "#34D399" : "var(--text-muted)",
                  background: isWinner ? "rgba(16, 185, 129, 0.08)" : "transparent",
                }}
              >
                {isWinner ? (
                  <>
                    <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <CheckCircle2 size={13} color="#10B981" />
                      Selected for Targeted Self-Correction
                    </span>
                    <Sparkles size={12} color="#10B981" />
                  </>
                ) : (
                  <span>Evaluated in Race</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

import React from "react";
import {
  Eye,
  Palette,
  Network,
  Code2,
  ShieldCheck,
  PlaySquare,
  Scale,
  Wrench,
  CheckCircle2,
  AlertCircle,
  Clock,
} from "lucide-react";

export type PipelineStage =
  | "idle"
  | "analyzing"
  | "extracting_tokens"
  | "planning_components"
  | "generating_code"
  | "validating_code"
  | "rendering"
  | "evaluating"
  | "correcting"
  | "completed"
  | "failed";

interface PipelineStepperProps {
  currentStage: PipelineStage;
  logs: string[];
  currentIteration: number;
  maxIterations: number;
  currentScore: number;
  totalTokens: number;
  totalCost: number;
}

const STAGES = [
  { id: "analyzing", label: "UI Perception & IR", desc: "Extracting structured UI IR nodes", icon: Eye },
  { id: "extracting_tokens", label: "Design Tokens", desc: "Serializing typography & color scales", icon: Palette },
  { id: "planning_components", label: "Component Tree", desc: "Decomposing layout into reusable components", icon: Network },
  { id: "generating_code", label: "Code Generation", desc: "Synthesizing idiomatic target files", icon: Code2 },
  { id: "validating_code", label: "AST Validation Gate", desc: "Babel syntax check & auto-healing", icon: ShieldCheck },
  { id: "rendering", label: "Sandboxed Vite Execution", desc: "Process-isolated Playwright screenshot capture", icon: PlaySquare },
  { id: "evaluating", label: "Visual Evaluator", desc: "Computing deterministic SSIM & PixelMatch", icon: Scale },
  { id: "correcting", label: "Targeted Correction", desc: "Applying surgical CSS/JSX patches", icon: Wrench },
];

export const PipelineStepper: React.FC<PipelineStepperProps> = ({
  currentStage,
  logs,
  currentIteration,
  maxIterations,
  currentScore,
  totalTokens,
  totalCost,
}) => {
  const getStageStatus = (stageId: string) => {
    const stageOrder = [
      "analyzing",
      "extracting_tokens",
      "planning_components",
      "generating_code",
      "validating_code",
      "rendering",
      "evaluating",
      "correcting",
    ];

    if (currentStage === "completed") return "completed";
    if (currentStage === "failed") return "failed";

    const currentIdx = stageOrder.indexOf(currentStage);
    const thisIdx = stageOrder.indexOf(stageId);

    if (thisIdx === currentIdx) return "active";
    if (thisIdx < currentIdx) return "completed";
    return "pending";
  };

  return (
    <div className="glass-panel" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h3>Autonomous Pipeline Stepper</h3>
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
            Iteration {currentIteration > 0 ? currentIteration : 1} of {maxIterations} • Current Similarity: {(currentScore * 100).toFixed(1)}%
          </p>
        </div>

        <div style={{ display: "flex", gap: "12px", fontSize: "0.8rem", color: "var(--text-muted)" }}>
          <span>Tokens: <strong style={{ color: "var(--text-primary)" }}>{totalTokens}</strong></span>
          <span>Cost: <strong style={{ color: "var(--color-success)" }}>${totalCost.toFixed(4)}</strong></span>
        </div>
      </div>

      {/* Steps List */}
      <div className="stepper-container">
        {STAGES.map((s) => {
          const status = getStageStatus(s.id);
          const Icon = s.icon;

          return (
            <div key={s.id} className={`step-item ${status}`}>
              <div className="step-icon-wrap">
                {status === "completed" ? (
                  <CheckCircle2 size={16} />
                ) : (
                  <Icon size={16} />
                )}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.85rem", fontWeight: 700, color: status === "active" ? "var(--color-primary)" : "var(--text-primary)" }}>
                    {s.label}
                  </span>
                  <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: status === "active" ? "var(--color-primary)" : status === "completed" ? "var(--color-success)" : "var(--text-muted)" }}>
                    {status}
                  </span>
                </div>
                <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                  {s.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Real-time Logs Console */}
      <div style={{ marginTop: "4px" }}>
        <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "6px" }}>
          Live Pipeline Console Logs
        </div>
        <div
          style={{
            background: "#030712",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-sm)",
            padding: "12px",
            fontFamily: "var(--font-mono)",
            fontSize: "0.75rem",
            color: "#94a3b8",
            maxHeight: "140px",
            overflowY: "auto",
            lineHeight: 1.5,
          }}
        >
          {logs.length === 0 ? (
            <span style={{ color: "#475569" }}>Waiting for pipeline execution to begin...</span>
          ) : (
            logs.map((log, i) => (
              <div key={i} style={{ color: log.includes("PASSED") || log.includes("threshold") ? "#10b981" : log.includes("CORRECTING") ? "#f59e0b" : "#cbd5e1" }}>
                {log}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

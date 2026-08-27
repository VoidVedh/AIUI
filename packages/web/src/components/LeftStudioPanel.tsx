import React, { useRef, useState } from "react";
import { UploadCloud, Image as ImageIcon, Zap, Coins, Clock, Sparkles, CheckCircle2, RotateCw } from "lucide-react";

export interface FixturePreset {
  id: string;
  name: string;
  category: string;
  description: string;
  imageUrl: string;
  viewport?: { width: number; height: number };
}

interface LeftStudioPanelProps {
  fixtures: FixturePreset[];
  selectedFixtureId: string | null;
  onSelectFixture: (id: string) => void;
  customFile: File | null;
  onUploadFile: (file: File | null) => void;
  previewUrl: string | null;
  isRunning: boolean;
  currentStage: string;
  currentIteration: number;
  maxIterations: number;
  totalTokens: number;
  totalCost: number;
  onStartSynthesis: () => void;
}

export const LeftStudioPanel: React.FC<LeftStudioPanelProps> = ({
  fixtures,
  selectedFixtureId,
  onSelectFixture,
  customFile,
  onUploadFile,
  previewUrl,
  isRunning,
  currentStage,
  currentIteration,
  maxIterations,
  totalTokens,
  totalCost,
  onStartSynthesis,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onUploadFile(e.dataTransfer.files[0]);
    }
  };

  const stageLabels: Record<string, string> = {
    idle: "Ready to Synthesize",
    analyzing: "1. VLM Semantic & CV Analysis",
    extracting_tokens: "2. Design Token Extraction",
    planning_components: "3. Component Decomposition",
    generating_code: "4. React 19 JSX Synthesis",
    validating_code: "5. AST Module Validation",
    rendering: "6. Sandboxed Browser Render",
    evaluating: "7. Deterministic SSIM & IoU Diff",
    correcting: "8. Targeted CSS Self-Correction",
    completed: "Synthesis Complete",
    failed: "Pipeline Terminated",
  };

  return (
    <aside className="studio-left-panel">
      {/* Upload Dropzone */}
      <div className="studio-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Design Input
          </span>
          {customFile && (
            <button
              onClick={() => onUploadFile(null)}
              style={{ background: "transparent", border: "none", color: "#F87171", fontSize: "12px", cursor: "pointer" }}
            >
              Reset to Presets
            </button>
          )}
        </div>

        <div
          className={`dropzone ${isDragOver ? "active" : ""}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => onUploadFile(e.target.files?.[0] || null)}
            accept="image/png, image/jpeg, image/webp"
            style={{ display: "none" }}
          />

          {previewUrl ? (
            <div style={{ position: "relative" }}>
              <img src={previewUrl} alt="Target UI Preview" className="dropzone-preview" />
              <div
                style={{
                  position: "absolute",
                  bottom: "8px",
                  right: "8px",
                  background: "rgba(0,0,0,0.75)",
                  padding: "4px 8px",
                  borderRadius: "6px",
                  fontSize: "11px",
                  backdropFilter: "blur(8px)",
                }}
              >
                Click or Drop to replace
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", padding: "16px 0" }}>
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "50%",
                  background: "rgba(59, 130, 246, 0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <UploadCloud size={22} color="#60A5FA" />
              </div>
              <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>
                Drop design screenshot here
              </p>
              <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                Supports PNG, JPEG up to 20MB
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Preset Benchmarks */}
      <div className="studio-card">
        <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "10px" }}>
          Canonical Fixtures
        </span>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
          {fixtures.map((f) => {
            const isSelected = selectedFixtureId === f.id && !customFile;
            return (
              <button
                key={f.id}
                onClick={() => onSelectFixture(f.id)}
                style={{
                  padding: "8px 10px",
                  background: isSelected ? "rgba(59, 130, 246, 0.15)" : "var(--bg-surface)",
                  border: isSelected ? "1px solid var(--color-primary)" : "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-sm)",
                  color: isSelected ? "#93C5FD" : "var(--text-secondary)",
                  textAlign: "left",
                  cursor: "pointer",
                  fontSize: "12px",
                  fontWeight: isSelected ? 600 : 500,
                  transition: "all 0.15s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <ImageIcon size={13} />
                  <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {f.name}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Telemetry Badge Bar */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "8px",
        }}
      >
        <div
          style={{
            background: "var(--bg-surface-elevated)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-sm)",
            padding: "10px",
            textAlign: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", color: "var(--text-muted)", fontSize: "11px", marginBottom: "2px" }}>
            <Zap size={12} color="#60A5FA" />
            Tokens
          </div>
          <strong style={{ fontSize: "14px", color: "var(--text-primary)" }}>{totalTokens.toLocaleString()}</strong>
        </div>

        <div
          style={{
            background: "var(--bg-surface-elevated)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-sm)",
            padding: "10px",
            textAlign: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", color: "var(--text-muted)", fontSize: "11px", marginBottom: "2px" }}>
            <Coins size={12} color="#34D399" />
            Cost
          </div>
          <strong style={{ fontSize: "14px", color: "var(--text-primary)" }}>${totalCost.toFixed(4)}</strong>
        </div>

        <div
          style={{
            background: "var(--bg-surface-elevated)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-sm)",
            padding: "10px",
            textAlign: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", color: "var(--text-muted)", fontSize: "11px", marginBottom: "2px" }}>
            <Clock size={12} color="#FBBF24" />
            Loop Iter
          </div>
          <strong style={{ fontSize: "14px", color: "var(--text-primary)" }}>
            {currentIteration} / {maxIterations}
          </strong>
        </div>
      </div>

      {/* Execution Progress Pill */}
      {isRunning && (
        <div style={{ display: "flex", justifyContent: "center", margin: "4px 0" }}>
          <div className="progress-pill">
            <span className="pulse-dot" />
            <span>{stageLabels[currentStage] || currentStage}</span>
          </div>
        </div>
      )}

      {/* Primary Action CTA */}
      <div style={{ marginTop: "auto", paddingTop: "12px" }}>
        <button
          className="btn-primary"
          onClick={onStartSynthesis}
          disabled={isRunning}
        >
          {isRunning ? (
            <>
              <RotateCw size={16} className="spin" style={{ animation: "spin 1s linear infinite" }} />
              <span>Executing Autonomous Self-Correction...</span>
            </>
          ) : (
            <>
              <Sparkles size={16} />
              <span>Synthesize React Component</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
};

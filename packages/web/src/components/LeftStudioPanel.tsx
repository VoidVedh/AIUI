import React, { useRef, useState, useEffect } from "react";
import { UploadCloud, Image as ImageIcon, Zap, Coins, Clock, Sparkles, RotateCw, Trophy } from "lucide-react";
import type { ProviderCatalogEntry } from "@aiui/orchestrator";

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
  selectedProvider?: string;
  onSelectProvider?: (provider: string) => void;
  multiModelMode?: "single" | "race";
  onToggleMultiModelMode?: (mode: "single" | "race") => void;
  candidateProviders?: string[];
  onSelectCandidateProviders?: (candidates: string[]) => void;
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
  selectedProvider = "gemma",
  onSelectProvider,
  multiModelMode = "single",
  onToggleMultiModelMode,
  candidateProviders = ["gemma", "gemini", "openai"],
  onSelectCandidateProviders,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [providers, setProviders] = useState<ProviderCatalogEntry[]>([
    { id: "gemma", name: "Gemma 3 27B", displayName: "Gemma 3", defaultModel: "google/gemma-3-27b-it:free", isFree: true, requiresKey: true, isConfigured: true },
    { id: "puter", name: "Puter (Gemini)", displayName: "Puter Gemini", defaultModel: "gemini-2.5-flash", isFree: true, requiresKey: false, isConfigured: true },
    { id: "gemini", name: "Gemini 2.5 Flash", displayName: "Gemini", defaultModel: "gemini-2.5-flash", isFree: false, requiresKey: true, isConfigured: false },
    { id: "openai", name: "GPT-4o Vision", displayName: "OpenAI", defaultModel: "gpt-4o", isFree: false, requiresKey: true, isConfigured: false },
    { id: "anthropic", name: "Claude 3.5 Sonnet", displayName: "Anthropic", defaultModel: "claude-3-5-sonnet-20241022", isFree: false, requiresKey: true, isConfigured: false },
  ]);

  useEffect(() => {
    fetch("/api/providers")
      .then((res) => res.json())
      .then((data: ProviderCatalogEntry[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setProviders(data);
        }
      })
      .catch(() => {});
  }, []);

  const toggleRace = () => {
    const nextMode = multiModelMode === "race" ? "single" : "race";
    onToggleMultiModelMode?.(nextMode);
  };

  const handleModelClick = (providerId: string) => {
    if (multiModelMode === "race") {
      let updated: string[];
      if (candidateProviders.includes(providerId)) {
        if (candidateProviders.length > 1) {
          updated = candidateProviders.filter((p) => p !== providerId);
        } else {
          updated = candidateProviders;
        }
      } else {
        if (candidateProviders.length < 3) {
          updated = [...candidateProviders, providerId];
        } else {
          updated = [...candidateProviders.slice(1), providerId];
        }
      }
      onSelectCandidateProviders?.(updated);
    } else {
      onSelectProvider?.(providerId);
    }
  };

  const displayProviders = providers.filter((p) => p.id !== "offline");

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

      {/* Model Selection & Multi-Model Race Card */}
      <div className="studio-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
          <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Model {multiModelMode === "race" && <span style={{ color: "#FBBF24" }}>({candidateProviders.length}/3)</span>}
          </span>
          <button
            type="button"
            onClick={toggleRace}
            style={{
              background: multiModelMode === "race" ? "rgba(251, 191, 36, 0.2)" : "rgba(255, 255, 255, 0.05)",
              border: multiModelMode === "race" ? "1px solid #FBBF24" : "1px solid var(--border-subtle)",
              color: multiModelMode === "race" ? "#FBBF24" : "var(--text-muted)",
              borderRadius: "12px",
              padding: "2px 8px",
              fontSize: "10px",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <Trophy size={10} />
            Race: {multiModelMode === "race" ? "ON" : "OFF"}
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
          {displayProviders.map((p) => {
            const isSelected = multiModelMode === "race" ? candidateProviders.includes(p.id) : selectedProvider === p.id;
            const isGemma = p.id === "gemma";

            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handleModelClick(p.id)}
                style={{
                  padding: "7px 8px",
                  background: isSelected
                    ? multiModelMode === "race"
                      ? "rgba(251, 191, 36, 0.15)"
                      : "rgba(59, 130, 246, 0.15)"
                    : "var(--bg-surface)",
                  border: isSelected
                    ? multiModelMode === "race"
                      ? "1px solid #FBBF24"
                      : "1px solid var(--color-primary)"
                    : "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-sm)",
                  color: isSelected ? "#FFFFFF" : "var(--text-secondary)",
                  textAlign: "left",
                  cursor: "pointer",
                  fontSize: "11px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "3px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                  <strong style={{ fontSize: "11px", textTransform: "capitalize" }}>
                    {p.id === "gemma" ? "Gemma" : p.id === "puter" ? "Puter" : p.id === "gemini" ? "Gemini" : p.id === "openai" ? "OpenAI" : p.id === "anthropic" ? "Anthropic" : p.displayName}
                  </strong>
                  {(p.isFree || isGemma || p.id === "puter") && (
                    <span
                      style={{
                        fontSize: "9px",
                        fontWeight: 700,
                        padding: "1px 4px",
                        borderRadius: "4px",
                        background: "rgba(16, 185, 129, 0.2)",
                        color: "#34D399",
                      }}
                    >
                      Free
                    </span>
                  )}
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                  <span style={{ fontSize: "9px", color: p.isConfigured ? "#34D399" : "#94A3B8" }}>
                    {p.isConfigured ? "Ready" : "Key Needed"}
                  </span>
                  {multiModelMode === "race" && isSelected && (
                    <span style={{ fontSize: "9px", fontWeight: 800, color: "#FBBF24" }}>✓</span>
                  )}
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

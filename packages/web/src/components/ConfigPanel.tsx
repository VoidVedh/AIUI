import React, { useState, useRef, useEffect } from "react";
import { Upload, Play, Smartphone, Monitor, Trophy } from "lucide-react";
import type { ProviderCatalogEntry } from "@aiui/orchestrator";

export interface FixturePreset {
  id: string;
  name: string;
  category: string;
  viewport: { width: number; height: number };
  description: string;
  imageUrl: string;
}

interface ConfigPanelProps {
  fixtures: FixturePreset[];
  selectedFixtureId: string | null;
  onSelectFixture: (id: string) => void;
  customFile: File | null;
  onUploadFile: (file: File | null) => void;
  target: "react" | "vanillajs" | "flutter";
  onChangeTarget: (target: "react" | "vanillajs" | "flutter") => void;
  similarityThreshold: number;
  onChangeThreshold: (val: number) => void;
  maxIterations: number;
  onChangeMaxIterations: (val: number) => void;
  onStartRun: () => void;
  isRunning: boolean;
  selectedProvider?: string;
  onChangeProvider?: (provider: string) => void;
  multiModelMode?: "single" | "race";
  onChangeMultiModelMode?: (mode: "single" | "race") => void;
  candidateProviders?: string[];
  onChangeCandidateProviders?: (candidates: string[]) => void;
}

export const ConfigPanel: React.FC<ConfigPanelProps> = ({
  fixtures,
  selectedFixtureId,
  onSelectFixture,
  customFile,
  onUploadFile,
  target,
  onChangeTarget,
  similarityThreshold,
  onChangeThreshold,
  maxIterations: _maxIterations,
  onChangeMaxIterations: _onChangeMaxIterations,
  onStartRun,
  isRunning,
  selectedProvider = "gemma",
  onChangeProvider,
  multiModelMode = "single",
  onChangeMultiModelMode,
  candidateProviders = ["gemma", "gemini", "openai"],
  onChangeCandidateProviders,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [providers, setProviders] = useState<ProviderCatalogEntry[]>([
    { id: "gemma", name: "Gemma 3 27B", displayName: "Gemma 3 (OpenRouter)", defaultModel: "google/gemma-3-27b-it:free", isFree: true, requiresKey: true, isConfigured: true },
    { id: "puter", name: "Puter (Gemini)", displayName: "Puter Gemini", defaultModel: "gemini-2.5-flash", isFree: true, requiresKey: false, isConfigured: true },
    { id: "gemini", name: "Gemini 2.5 Flash", displayName: "Google Gemini", defaultModel: "gemini-2.5-flash", isFree: false, requiresKey: true, isConfigured: false },
    { id: "openai", name: "GPT-4o Vision", displayName: "OpenAI GPT-4o", defaultModel: "gpt-4o", isFree: false, requiresKey: true, isConfigured: false },
    { id: "anthropic", name: "Claude 3.5 Sonnet", displayName: "Anthropic Claude", defaultModel: "claude-3-5-sonnet-20241022", isFree: false, requiresKey: true, isConfigured: false },
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
    onChangeMultiModelMode?.(nextMode);
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
      onChangeCandidateProviders?.(updated);
    } else {
      onChangeProvider?.(providerId);
    }
  };

  const displayProviders = providers.filter((p) => p.id !== "offline");

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onUploadFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="glass-panel" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h3>Pipeline Configuration</h3>
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
            Select a benchmark UI fixture or upload your own design screenshot.
          </p>
        </div>
      </div>

      {/* Fixtures Selector */}
      <div>
        <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "8px", display: "block" }}>
          Canonical Benchmark Presets
        </label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "10px" }}>
          {fixtures.map((f) => {
            const isSelected = selectedFixtureId === f.id && !customFile;
            return (
              <div
                key={f.id}
                className={`fixture-card ${isSelected ? "selected" : ""}`}
                onClick={() => onSelectFixture(f.id)}
              >
                <img src={f.imageUrl} alt={f.name} className="fixture-thumb" />
                <div>
                  <div style={{ fontSize: "0.8rem", fontWeight: 700, color: isSelected ? "var(--color-primary)" : "var(--text-primary)" }}>
                    {f.name}
                  </div>
                  <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                    {f.viewport.width <= 480 ? <Smartphone size={10} /> : <Monitor size={10} />}
                    {f.viewport.width}x{f.viewport.height}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Upload Zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: `2px dashed ${dragActive ? "var(--color-primary)" : "var(--border-medium)"}`,
          borderRadius: "var(--radius-md)",
          padding: "20px",
          textAlign: "center",
          background: customFile ? "rgba(59, 130, 246, 0.08)" : "rgba(15, 23, 42, 0.4)",
          cursor: "pointer",
          transition: "all 0.2s ease",
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,application/json,.json"
          style={{ display: "none" }}
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              onUploadFile(e.target.files[0]);
            }
          }}
        />
        <Upload size={24} style={{ margin: "0 auto 8px", color: customFile ? "var(--color-primary)" : "var(--text-muted)" }} />
        {customFile ? (
          <div>
            <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--color-primary)" }}>
              {customFile.name}
            </span>
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
              {(customFile.size / 1024).toFixed(1)} KB (Click or drop to replace)
            </p>
          </div>
        ) : (
          <div>
            <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>Or Drop Custom Screenshot / Figma JSON Here</span>
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>PNG, JPG, WebP or Figma REST JSON up to 20MB</p>
          </div>
        )}
      </div>

      {/* Execution Options */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {/* Model Selection & Multi-Model Race Control */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "6px" }}>
              <span>Vision & LLM Model</span>
              {multiModelMode === "race" && (
                <span style={{ fontSize: "11px", color: "#FBBF24", fontWeight: 700 }}>
                  ({candidateProviders.length}/3 in race)
                </span>
              )}
            </label>

            <button
              type="button"
              onClick={toggleRace}
              style={{
                background: multiModelMode === "race" ? "rgba(251, 191, 36, 0.2)" : "rgba(255, 255, 255, 0.05)",
                border: multiModelMode === "race" ? "1px solid #FBBF24" : "1px solid var(--border-subtle)",
                color: multiModelMode === "race" ? "#FBBF24" : "var(--text-muted)",
                borderRadius: "14px",
                padding: "3px 10px",
                fontSize: "11px",
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "5px",
                transition: "all 0.15s ease",
              }}
            >
              <Trophy size={11} />
              Multi-Model Race: {multiModelMode === "race" ? "ON" : "OFF"}
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "8px" }}>
            {displayProviders.map((p) => {
              const isSelected = multiModelMode === "race" ? candidateProviders.includes(p.id) : selectedProvider === p.id;
              const isGemma = p.id === "gemma";

              return (
                <button
                  key={p.id}
                  type="button"
                  className={`btn-secondary ${isSelected ? "active" : ""}`}
                  onClick={() => handleModelClick(p.id)}
                  style={{
                    padding: "8px 10px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    gap: "4px",
                    background: isSelected
                      ? multiModelMode === "race"
                        ? "rgba(251, 191, 36, 0.12)"
                        : "rgba(59, 130, 246, 0.2)"
                      : "rgba(15, 23, 42, 0.4)",
                    borderColor: isSelected
                      ? multiModelMode === "race"
                        ? "#FBBF24"
                        : "var(--color-primary)"
                      : "var(--border-subtle)",
                    color: isSelected ? "#FFFFFF" : "var(--text-secondary)",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                    <strong style={{ fontSize: "0.8rem", textTransform: "capitalize" }}>
                      {p.id === "gemma" ? "Gemma" : p.id === "puter" ? "Puter" : p.id === "gemini" ? "Gemini" : p.id === "openai" ? "OpenAI" : p.id === "anthropic" ? "Anthropic" : p.displayName}
                    </strong>
                    {(p.isFree || isGemma || p.id === "puter") && (
                      <span
                        style={{
                          fontSize: "10px",
                          fontWeight: 700,
                          padding: "1px 5px",
                          borderRadius: "4px",
                          background: "rgba(16, 185, 129, 0.2)",
                          color: "#34D399",
                        }}
                      >
                        Free
                      </span>
                    )}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", marginTop: "2px" }}>
                    <span
                      style={{
                        fontSize: "10px",
                        fontWeight: 600,
                        color: p.isConfigured ? "#34D399" : "#94A3B8",
                      }}
                    >
                      {p.isConfigured ? "Ready" : "Key Needed"}
                    </span>

                    {multiModelMode === "race" && isSelected && (
                      <span
                        style={{
                          fontSize: "9px",
                          fontWeight: 800,
                          padding: "1px 5px",
                          borderRadius: "10px",
                          background: "#FBBF24",
                          color: "#0F172A",
                        }}
                      >
                        ✓
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Target Framework and Similarity */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          {/* Target Framework */}
          <div>
            <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px", display: "block" }}>
              Target Framework
            </label>
            <div style={{ display: "flex", gap: "6px" }}>
              {[
                { id: "react", label: "React 19" },
                { id: "vanillajs", label: "Vanilla JS" },
                { id: "flutter", label: "Flutter" },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={`btn-secondary ${target === t.id ? "active" : ""}`}
                  style={{
                    flex: 1,
                    fontSize: "0.75rem",
                    padding: "8px 10px",
                    background: target === t.id ? "rgba(59, 130, 246, 0.2)" : undefined,
                    borderColor: target === t.id ? "var(--color-primary)" : undefined,
                    color: target === t.id ? "#ffffff" : "var(--text-secondary)",
                  }}
                  onClick={() => onChangeTarget(t.id as any)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Target Similarity Threshold */}
          <div>
            <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px", display: "flex", justifyContent: "space-between" }}>
              <span>Target Similarity</span>
              <span style={{ color: "var(--color-primary)", fontWeight: 700 }}>{(similarityThreshold * 100).toFixed(0)}%</span>
            </label>
            <input
              type="range"
              min="0.80"
              max="0.98"
              step="0.01"
              value={similarityThreshold}
              onChange={(e) => onChangeThreshold(parseFloat(e.target.value))}
              style={{ width: "100%", accentColor: "var(--color-primary)" }}
            />
          </div>
        </div>
      </div>

      {/* Launch CTA */}
      <button
        type="button"
        className="btn-primary"
        disabled={isRunning}
        onClick={onStartRun}
        style={{ width: "100%", padding: "14px" }}
      >
        <Play size={18} />
        <span>{isRunning ? "Running Autonomous Pipeline..." : "Generate Code & Run Loop"}</span>
      </button>
    </div>
  );
};

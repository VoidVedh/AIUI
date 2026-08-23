import React, { useState, useRef } from "react";
import { Upload, Play, CheckCircle2, Sliders, Smartphone, Monitor } from "lucide-react";

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
  maxIterations,
  onChangeMaxIterations,
  onStartRun,
  isRunning,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

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

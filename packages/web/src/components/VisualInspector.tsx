import React, { useState, useRef } from "react";
import { Columns, SplitSquareVertical, Flame, Eye } from "lucide-react";

interface VisualInspectorProps {
  targetImageUrl: string | null;
  renderedImageUrl: string | null;
  diffImageUrl: string | null;
}

export const VisualInspector: React.FC<VisualInspectorProps> = ({
  targetImageUrl,
  renderedImageUrl,
  diffImageUrl,
}) => {
  const [mode, setMode] = useState<"slider" | "side-by-side" | "heatmap">("slider");
  const [sliderPos, setSliderPos] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const handleMouseDown = () => {
    isDragging.current = true;
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(percentage);
  };

  return (
    <div className="glass-panel" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h3>Visual Diff & Render Inspector</h3>
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
            Inspect pixel-accurate rendering fidelity against the target design screenshot.
          </p>
        </div>

        <div style={{ display: "flex", gap: "6px" }}>
          {[
            { id: "slider", label: "Split Slider", icon: SplitSquareVertical },
            { id: "side-by-side", label: "Side-by-Side", icon: Columns },
            { id: "heatmap", label: "Diff Heatmap", icon: Flame },
          ].map((m) => {
            const Icon = m.icon;
            const active = mode === m.id;
            return (
              <button
                key={m.id}
                type="button"
                className={`btn-secondary ${active ? "active" : ""}`}
                style={{
                  fontSize: "0.8rem",
                  padding: "6px 12px",
                  background: active ? "rgba(59, 130, 246, 0.2)" : undefined,
                  borderColor: active ? "var(--color-primary)" : undefined,
                  color: active ? "#ffffff" : "var(--text-secondary)",
                }}
                onClick={() => setMode(m.id as any)}
              >
                <Icon size={14} />
                <span>{m.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Visual Canvas */}
      {!targetImageUrl && !renderedImageUrl ? (
        <div
          style={{
            height: "400px",
            border: "1px dashed var(--border-medium)",
            borderRadius: "var(--radius-md)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--text-muted)",
            gap: "12px",
          }}
        >
          <Eye size={36} />
          <p style={{ fontSize: "0.9rem" }}>No rendering output available yet. Launch a pipeline run to inspect.</p>
        </div>
      ) : mode === "slider" ? (
        <div
          ref={containerRef}
          className="split-viewer-container"
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onMouseMove={handleMouseMove}
        >
          {/* Target Layer (Bottom) */}
          <div className="split-layer">
            <img src={targetImageUrl || ""} alt="Target Screenshot" />
            <span style={{ position: "absolute", bottom: "16px", left: "16px", background: "rgba(0,0,0,0.7)", padding: "4px 10px", borderRadius: "4px", fontSize: "0.75rem", fontWeight: 600, color: "#94a3b8" }}>
              Target Design
            </span>
          </div>

          {/* Rendered Layer (Top clipped by slider) */}
          <div
            className="split-layer"
            style={{
              clipPath: `polygon(${sliderPos}% 0, 100% 0, 100% 100%, ${sliderPos}% 100%)`,
            }}
          >
            <img src={renderedImageUrl || targetImageUrl || ""} alt="Rendered Application" />
            <span style={{ position: "absolute", bottom: "16px", right: "16px", background: "rgba(59,130,246,0.8)", padding: "4px 10px", borderRadius: "4px", fontSize: "0.75rem", fontWeight: 600, color: "#ffffff" }}>
              Rendered Code Output
            </span>
          </div>

          {/* Draggable Divider */}
          <div className="split-handle" style={{ left: `${sliderPos}%` }}>
            <div className="split-handle-btn">
              <SplitSquareVertical size={16} />
            </div>
          </div>
        </div>
      ) : mode === "side-by-side" ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div style={{ border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", overflow: "hidden", background: "#020617", position: "relative" }}>
            <img src={targetImageUrl || ""} alt="Target" style={{ width: "100%", height: "420px", objectFit: "contain" }} />
            <span style={{ position: "absolute", bottom: "12px", left: "12px", background: "rgba(0,0,0,0.7)", padding: "4px 10px", borderRadius: "4px", fontSize: "0.75rem", fontWeight: 600 }}>
              Target Design (Input)
            </span>
          </div>

          <div style={{ border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", overflow: "hidden", background: "#020617", position: "relative" }}>
            <img src={renderedImageUrl || targetImageUrl || ""} alt="Rendered" style={{ width: "100%", height: "420px", objectFit: "contain" }} />
            <span style={{ position: "absolute", bottom: "12px", right: "12px", background: "rgba(59,130,246,0.8)", padding: "4px 10px", borderRadius: "4px", fontSize: "0.75rem", fontWeight: 600 }}>
              Rendered Application (Output)
            </span>
          </div>
        </div>
      ) : (
        <div style={{ border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", overflow: "hidden", background: "#020617", position: "relative" }}>
          <img src={diffImageUrl || targetImageUrl || ""} alt="Pixel Diff Heatmap" style={{ width: "100%", height: "480px", objectFit: "contain" }} />
          <span style={{ position: "absolute", bottom: "12px", left: "12px", background: "rgba(239,68,68,0.85)", padding: "4px 10px", borderRadius: "4px", fontSize: "0.75rem", fontWeight: 600 }}>
            Pixel Diff Heatmap Overlay
          </span>
        </div>
      )}
    </div>
  );
};

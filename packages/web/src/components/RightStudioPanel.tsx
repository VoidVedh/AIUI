import React, { useState } from "react";
import { Eye, Code2, Columns2, Copy, Download, Check, ExternalLink, Layers, Sparkles } from "lucide-react";

export interface GeneratedCodeFile {
  path: string;
  content: string;
  language: string;
}

interface RightStudioPanelProps {
  runId: string | null;
  overallScore: number;
  ssimScore: number;
  pixelMatchScore: number;
  layoutIouScore: number;
  targetImageUrl: string | null;
  renderedImageUrl: string | null;
  diffImageUrl: string | null;
  files: GeneratedCodeFile[];
  liveSandboxUrl?: string | null;
}

export const RightStudioPanel: React.FC<RightStudioPanelProps> = ({
  runId,
  overallScore,
  ssimScore,
  pixelMatchScore,
  layoutIouScore,
  targetImageUrl,
  renderedImageUrl,
  diffImageUrl,
  files,
  liveSandboxUrl,
}) => {
  const [activeTab, setActiveTab] = useState<"preview" | "code" | "diff">("preview");
  const [selectedFilePath, setSelectedFilePath] = useState<string>("src/App.jsx");
  const [copied, setCopied] = useState(false);
  const [diffMode, setDiffMode] = useState<"split" | "side" | "heatmap">("split");
  const [sliderPos, setSliderPos] = useState(50);

  const selectedFile = files.find((f) => f.path === selectedFilePath) || files[0];

  const handleCopyCode = () => {
    if (selectedFile?.content) {
      navigator.clipboard.writeText(selectedFile.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadZip = () => {
    if (runId) {
      window.location.href = `/api/runs/${runId}/download`;
    }
  };

  return (
    <main className="studio-right-panel">
      {/* Top Fidelity & Studio Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "12px 24px",
          background: "var(--bg-surface)",
          borderBottom: "1px solid var(--border-subtle)",
          flexShrink: 0,
        }}
      >
        {/* Tab Controls */}
        <div className="studio-tabs">
          <button
            className={`studio-tab-btn ${activeTab === "preview" ? "active" : ""}`}
            onClick={() => setActiveTab("preview")}
          >
            <Eye size={14} />
            Live Preview
          </button>
          <button
            className={`studio-tab-btn ${activeTab === "code" ? "active" : ""}`}
            onClick={() => setActiveTab("code")}
          >
            <Code2 size={14} />
            React TSX
            {files.length > 0 && (
              <span style={{ fontSize: "10px", padding: "1px 5px", borderRadius: "10px", background: "rgba(255,255,255,0.1)" }}>
                {files.length}
              </span>
            )}
          </button>
          <button
            className={`studio-tab-btn ${activeTab === "diff" ? "active" : ""}`}
            onClick={() => setActiveTab("diff")}
          >
            <Columns2 size={14} />
            Visual Diff
          </button>
        </div>

        {/* Fidelity Score Chips */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div className={`score-chip ${overallScore >= 0.8 ? "highlight" : ""}`}>
            <Sparkles size={13} color={overallScore >= 0.8 ? "#34D399" : "#60A5FA"} />
            <span>Fidelity:</span>
            <strong>{(overallScore * 100).toFixed(1)}%</strong>
          </div>

          <div className="score-chip">
            <span style={{ color: "var(--text-muted)" }}>MSSIM:</span>
            <strong>{(ssimScore * 100).toFixed(1)}%</strong>
          </div>

          <div className="score-chip">
            <span style={{ color: "var(--text-muted)" }}>PixelMatch:</span>
            <strong>{(pixelMatchScore * 100).toFixed(1)}%</strong>
          </div>

          <div className="score-chip">
            <span style={{ color: "var(--text-muted)" }}>IoU:</span>
            <strong>{layoutIouScore.toFixed(2)}</strong>
          </div>
        </div>
      </div>

      {/* Main Workspace Area */}
      <div style={{ flex: 1, overflow: "hidden", position: "relative", display: "flex", flexDirection: "column" }}>
        {/* TAB 1: LIVE PREVIEW */}
        {activeTab === "preview" && (
          <div style={{ flex: 1, padding: "20px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", overflow: "auto" }}>
            {renderedImageUrl ? (
              <div
                style={{
                  maxWidth: "100%",
                  maxHeight: "100%",
                  borderRadius: "var(--radius-lg)",
                  overflow: "hidden",
                  border: "1px solid var(--border-medium)",
                  boxShadow: "0 20px 40px rgba(0,0,0,0.6)",
                  background: "#0F172A",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {/* Simulated Browser Bar */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "8px 16px",
                    background: "#1E293B",
                    borderBottom: "1px solid var(--border-subtle)",
                  }}
                >
                  <div style={{ display: "flex", gap: "6px" }}>
                    <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#EF4444" }} />
                    <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#F59E0B" }} />
                    <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#10B981" }} />
                  </div>
                  <div
                    style={{
                      flex: 1,
                      textAlign: "center",
                      fontSize: "11px",
                      color: "var(--text-muted)",
                      background: "rgba(0,0,0,0.3)",
                      padding: "3px 12px",
                      borderRadius: "4px",
                      maxWidth: "340px",
                      margin: "0 auto",
                    }}
                  >
                    AIUI Sandboxed React 19 Container
                  </div>
                </div>
                <img
                  src={renderedImageUrl}
                  alt="Rendered UI Output"
                  style={{ maxWidth: "100%", maxHeight: "calc(100vh - 220px)", objectFit: "contain", display: "block" }}
                />
              </div>
            ) : (
              <div style={{ textAlign: "center", color: "var(--text-muted)" }}>
                <Layers size={48} style={{ opacity: 0.3, marginBottom: "12px" }} />
                <p style={{ fontSize: "15px", fontWeight: 600, color: "var(--text-secondary)" }}>
                  No Render Output Yet
                </p>
                <p style={{ fontSize: "13px", marginTop: "4px" }}>
                  Select a fixture or upload an image and click <strong>Synthesize React Component</strong>.
                </p>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: REACT TSX CODE */}
        {activeTab === "code" && (
          <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", flex: 1, overflow: "hidden" }}>
            {/* File List */}
            <div
              style={{
                background: "var(--bg-surface)",
                borderRight: "1px solid var(--border-subtle)",
                padding: "16px 12px",
                overflowY: "auto",
              }}
            >
              <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "10px" }}>
                Synthesized Files
              </span>
              {files.length > 0 ? (
                files.map((file) => {
                  const isSelected = (selectedFile?.path || "") === file.path;
                  return (
                    <button
                      key={file.path}
                      onClick={() => setSelectedFilePath(file.path)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        width: "100%",
                        padding: "8px 10px",
                        background: isSelected ? "var(--bg-surface-elevated)" : "transparent",
                        border: "none",
                        borderRadius: "var(--radius-sm)",
                        color: isSelected ? "#93C5FD" : "var(--text-secondary)",
                        fontSize: "12px",
                        fontWeight: isSelected ? 600 : 400,
                        textAlign: "left",
                        cursor: "pointer",
                        marginBottom: "2px",
                      }}
                    >
                      <Code2 size={13} />
                      <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {file.path}
                      </span>
                    </button>
                  );
                })
              ) : (
                <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>Files will appear here once code is synthesized.</p>
              )}
            </div>

            {/* Code Content & Actions */}
            <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden", background: "#090A0F" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "10px 20px",
                  background: "var(--bg-surface)",
                  borderBottom: "1px solid var(--border-subtle)",
                }}
              >
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-secondary)" }}>
                  {selectedFile?.path || "No file selected"}
                </span>

                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={handleCopyCode}
                    disabled={!selectedFile}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "5px 10px",
                      background: "var(--bg-surface-elevated)",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: "var(--radius-sm)",
                      color: "var(--text-primary)",
                      fontSize: "12px",
                      cursor: "pointer",
                    }}
                  >
                    {copied ? <Check size={13} color="#34D399" /> : <Copy size={13} />}
                    {copied ? "Copied" : "Copy Code"}
                  </button>

                  <button
                    onClick={handleDownloadZip}
                    disabled={!runId}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "5px 10px",
                      background: "rgba(59, 130, 246, 0.15)",
                      border: "1px solid rgba(59, 130, 246, 0.3)",
                      borderRadius: "var(--radius-sm)",
                      color: "#93C5FD",
                      fontSize: "12px",
                      cursor: "pointer",
                    }}
                  >
                    <Download size={13} />
                    Download ZIP
                  </button>
                </div>
              </div>

              <div style={{ flex: 1, overflow: "auto", padding: "20px" }}>
                <pre style={{ margin: 0, fontFamily: "var(--font-mono)", fontSize: "13px", lineHeight: 1.6, color: "#E2E8F0" }}>
                  <code>{selectedFile?.content || "// Synthesized code will appear here after execution."}</code>
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: VISUAL DIFF */}
        {activeTab === "diff" && (
          <div style={{ flex: 1, padding: "20px", display: "flex", flexDirection: "column", overflow: "auto" }}>
            {/* Diff View Mode Selector */}
            <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginBottom: "16px" }}>
              <button
                onClick={() => setDiffMode("split")}
                style={{
                  padding: "6px 14px",
                  background: diffMode === "split" ? "var(--bg-surface-elevated)" : "transparent",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-sm)",
                  color: diffMode === "split" ? "#FFFFFF" : "var(--text-secondary)",
                  fontSize: "12px",
                  fontWeight: diffMode === "split" ? 600 : 400,
                  cursor: "pointer",
                }}
              >
                Split Slider
              </button>
              <button
                onClick={() => setDiffMode("side")}
                style={{
                  padding: "6px 14px",
                  background: diffMode === "side" ? "var(--bg-surface-elevated)" : "transparent",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-sm)",
                  color: diffMode === "side" ? "#FFFFFF" : "var(--text-secondary)",
                  fontSize: "12px",
                  fontWeight: diffMode === "side" ? 600 : 400,
                  cursor: "pointer",
                }}
              >
                Side by Side
              </button>
              <button
                onClick={() => setDiffMode("heatmap")}
                style={{
                  padding: "6px 14px",
                  background: diffMode === "heatmap" ? "var(--bg-surface-elevated)" : "transparent",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-sm)",
                  color: diffMode === "heatmap" ? "#FFFFFF" : "var(--text-secondary)",
                  fontSize: "12px",
                  fontWeight: diffMode === "heatmap" ? 600 : 400,
                  cursor: "pointer",
                }}
              >
                Diff Heatmap
              </button>
            </div>

            {/* Diff Viewers */}
            {targetImageUrl && renderedImageUrl ? (
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", flex: 1 }}>
                {diffMode === "split" && (
                  <div
                    style={{
                      position: "relative",
                      maxWidth: "960px",
                      width: "100%",
                      borderRadius: "var(--radius-lg)",
                      overflow: "hidden",
                      border: "1px solid var(--border-medium)",
                      boxShadow: "0 20px 40px rgba(0,0,0,0.6)",
                    }}
                  >
                    <img src={renderedImageUrl} alt="Rendered" style={{ width: "100%", display: "block" }} />
                    <div
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        bottom: 0,
                        width: `${sliderPos}%`,
                        overflow: "hidden",
                        borderRight: "2px solid #3B82F6",
                      }}
                    >
                      <img src={targetImageUrl} alt="Target" style={{ width: "960px", maxWidth: "none", display: "block" }} />
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={sliderPos}
                      onChange={(e) => setSliderPos(Number(e.target.value))}
                      style={{
                        position: "absolute",
                        bottom: "16px",
                        left: "50%",
                        transform: "translateX(-50%)",
                        width: "60%",
                        zIndex: 10,
                      }}
                    />
                  </div>
                )}

                {diffMode === "side" && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", width: "100%", maxWidth: "1100px" }}>
                    <div style={{ background: "var(--bg-surface-elevated)", padding: "12px", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-subtle)" }}>
                      <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: "8px" }}>
                        Target Design Screenshot
                      </span>
                      <img src={targetImageUrl} alt="Target" style={{ width: "100%", borderRadius: "var(--radius-md)" }} />
                    </div>
                    <div style={{ background: "var(--bg-surface-elevated)", padding: "12px", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-subtle)" }}>
                      <span style={{ fontSize: "12px", fontWeight: 600, color: "#60A5FA", display: "block", marginBottom: "8px" }}>
                        Synthesized React Output
                      </span>
                      <img src={renderedImageUrl} alt="Rendered" style={{ width: "100%", borderRadius: "var(--radius-md)" }} />
                    </div>
                  </div>
                )}

                {diffMode === "heatmap" && diffImageUrl && (
                  <div
                    style={{
                      maxWidth: "960px",
                      width: "100%",
                      borderRadius: "var(--radius-lg)",
                      overflow: "hidden",
                      border: "1px solid var(--border-medium)",
                    }}
                  >
                    <img src={diffImageUrl} alt="Diff Heatmap" style={{ width: "100%", display: "block" }} />
                  </div>
                )}
              </div>
            ) : (
              <div style={{ textAlign: "center", color: "var(--text-muted)", marginTop: "40px" }}>
                <Columns2 size={48} style={{ opacity: 0.3, marginBottom: "12px" }} />
                <p>Run synthesis to view visual comparison metrics and diff heatmaps.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
};

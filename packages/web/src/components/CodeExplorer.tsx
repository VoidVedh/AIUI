import React, { useState } from "react";
import { Code2, Download, Copy, Check, FileCode, FolderTree } from "lucide-react";

export interface GeneratedCodeFile {
  path: string;
  content: string;
}

interface CodeExplorerProps {
  files: GeneratedCodeFile[];
  runId: string | null;
  target: string;
}

export const CodeExplorer: React.FC<CodeExplorerProps> = ({ files, runId, target }) => {
  const [selectedFileIdx, setSelectedFileIdx] = useState(0);
  const [copied, setCopied] = useState(false);

  const currentFile = files[selectedFileIdx] || files[0];

  const handleCopy = () => {
    if (!currentFile) return;
    navigator.clipboard.writeText(currentFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!runId) return;
    window.location.href = `/api/runs/${runId}/download`;
  };

  if (files.length === 0) {
    return (
      <div className="glass-panel" style={{ textAlign: "center", padding: "40px 20px", color: "var(--text-muted)" }}>
        <Code2 size={32} style={{ margin: "0 auto 12px" }} />
        <p>No generated code files available yet. Run the pipeline to inspect synthesized production code.</p>
      </div>
    );
  }

  return (
    <div className="glass-panel" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h3>Synthesized Production Code Explorer</h3>
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
            Idiomatic {target.toUpperCase()} project ready to run with zero dependencies or manual patching.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button type="button" className="btn-secondary" onClick={handleCopy}>
            {copied ? <Check size={14} style={{ color: "var(--color-success)" }} /> : <Copy size={14} />}
            <span>{copied ? "Copied!" : "Copy File"}</span>
          </button>

          {runId && (
            <button type="button" className="btn-primary" onClick={handleDownload} style={{ padding: "8px 16px", fontSize: "0.85rem" }}>
              <Download size={15} />
              <span>Download Project ZIP</span>
            </button>
          )}
        </div>
      </div>

      {/* File Tabs */}
      <div className="code-tab-bar">
        {files.map((file, idx) => {
          const isActive = idx === selectedFileIdx;
          const fileName = file.path.split("/").pop() || file.path;
          return (
            <button
              key={file.path}
              type="button"
              className={`code-tab ${isActive ? "active" : ""}`}
              onClick={() => setSelectedFileIdx(idx)}
            >
              <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <FileCode size={13} style={{ color: isActive ? "var(--color-primary)" : "var(--text-muted)" }} />
                <span>{file.path}</span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Code Viewer */}
      <div style={{ position: "relative" }}>
        <pre className="code-pre">
          <code>{currentFile ? currentFile.content : ""}</code>
        </pre>
      </div>
    </div>
  );
};

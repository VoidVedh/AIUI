import { describe, it, expect } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { CandidateCompare } from "./CandidateCompare.js";
import type { ModelCandidate } from "@aiui/orchestrator";

describe("CandidateCompare UI Component", () => {
  const mockCandidates: ModelCandidate[] = [
    {
      id: "cand_gemma",
      provider: "gemma",
      model: "google/gemma-3-27b-it:free",
      initialScore: 0.88,
      ssimScore: 0.90,
      pixelMatchScore: 0.85,
      layoutIouScore: 0.92,
      previewArtifactPath: "/runs/run_1/candidate_gemma.png",
      selected: true,
    },
    {
      id: "cand_gemini",
      provider: "gemini",
      model: "gemini-2.5-flash",
      initialScore: 0.82,
      ssimScore: 0.83,
      pixelMatchScore: 0.80,
      layoutIouScore: 0.85,
      previewArtifactPath: "/runs/run_1/candidate_gemini.png",
      selected: false,
    },
  ];

  it("renders candidate cards with provider, model, and metrics", () => {
    const html = renderToStaticMarkup(
      React.createElement(CandidateCompare, {
        candidates: mockCandidates,
        selectedCandidateId: "cand_gemma",
        runId: "run_test",
      })
    );

    expect(html).toContain("gemma");
    expect(html).toContain("gemini");
    expect(html).toContain("88.0%");
    expect(html).toContain("82.0%");
    expect(html).toContain("MSSIM (45%)");
    expect(html).toContain("Pixel (35%)");
    expect(html).toContain("IoU (20%)");
  });

  it("highlights the winning candidate with WINNER badge", () => {
    const html = renderToStaticMarkup(
      React.createElement(CandidateCompare, {
        candidates: mockCandidates,
        selectedCandidateId: "cand_gemma",
        runId: "run_test",
      })
    );

    expect(html).toContain("WINNER");
    expect(html).toContain("Selected for Targeted Self-Correction");
  });

  it("renders graceful empty state when all candidates fail", () => {
    const html = renderToStaticMarkup(
      React.createElement(CandidateCompare, {
        candidates: [],
        runId: "run_failed",
        isAnalyzing: false,
      })
    );

    expect(html).toContain("No Candidate Results Available");
    expect(html).toContain("fallback");
  });

  it("renders in-progress state when race is analyzing", () => {
    const html = renderToStaticMarkup(
      React.createElement(CandidateCompare, {
        candidates: [],
        runId: "run_analyzing",
        isAnalyzing: true,
      })
    );

    expect(html).toContain("Multi-Model Race In Progress");
  });
});

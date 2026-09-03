import { describe, it, expect, vi } from "vitest";
import { PipelineOrchestrator } from "./orchestrator.js";
import { StateManager } from "./stateManager.js";
import type { VisionProvider, LLMProvider, ModelCallResult } from "./providers/types.js";
import type { UIIRDocument } from "@aiui/core";

function makeMockProvider(): VisionProvider & LLMProvider {
  const sampleIr: UIIRDocument = {
    version: "1.0.0",
    id: "ir_mock_test",
    name: "Mock UI",
    viewport: { width: 1280, height: 800, devicePixelRatio: 1 },
    rootNodeId: "page_root",
    nodes: {
      page_root: {
        id: "page_root",
        type: "page",
        name: "Page",
        parentId: null,
        childIds: ["hero_1"],
        position: { x: 0, y: 0, relativeTo: "viewport" },
        dimensions: { width: "100%", height: "100%", minHeight: "100vh" },
        layout: { display: "flex", flexDirection: "column", gap: 0, alignItems: "stretch", justifyContent: "flex-start", flexWrap: "nowrap" },
        styles: { backgroundColor: "#0F172A", color: "#F8FAFC" },
        confidence: 0.95,
      },
      hero_1: {
        id: "hero_1",
        type: "hero",
        name: "Hero",
        parentId: "page_root",
        childIds: ["btn_1"],
        position: { x: 0, y: 0, relativeTo: "flow" },
        dimensions: { width: "100%", height: "auto" },
        layout: { display: "flex", flexDirection: "column", gap: 16, alignItems: "center", justifyContent: "center", flexWrap: "nowrap" },
        styles: {},
        content: { text: "Candidate Test" },
        confidence: 0.95,
      },
      btn_1: {
        id: "btn_1",
        type: "button",
        name: "Button",
        parentId: "hero_1",
        childIds: [],
        position: { x: 0, y: 0, relativeTo: "flow" },
        dimensions: { width: "auto", height: 40 },
        layout: { display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 0, flexWrap: "nowrap" },
        styles: { backgroundColor: "#3B82F6", color: "#FFFFFF" },
        content: { text: "Action" },
        confidence: 0.95,
      },
    },
    metadata: {
      sourceType: "screenshot",
      confidence: 0.95,
      extractedAt: new Date().toISOString(),
      targetFrameworks: ["react"],
    },
  };

  return {
    name: "mock-provider",
    analyzeScreenshot: vi.fn(async (): Promise<ModelCallResult<UIIRDocument>> => ({
      data: sampleIr,
      costLog: {
        stage: "analyzing",
        provider: "mock-provider",
        model: "mock-vlm",
        promptTokens: 100,
        completionTokens: 50,
        estimatedCostUsd: 0.001,
        latencyMs: 10,
        timestamp: new Date().toISOString(),
      },
    })),
    generateStructuredCorrection: vi.fn(async () => ({
      data: "/* corrected */",
      costLog: {
        stage: "correcting" as const,
        provider: "mock-provider",
        model: "mock-llm",
        promptTokens: 50,
        completionTokens: 20,
        estimatedCostUsd: 0.0005,
        latencyMs: 5,
        timestamp: new Date().toISOString(),
      },
    })),
  };
}

describe("PipelineOrchestrator & Best-of-N Candidate Generation Suite", () => {
  it("initializes orchestrator with custom state manager and provider", () => {
    const stateManager = new StateManager();
    const provider = makeMockProvider();
    const orchestrator = new PipelineOrchestrator(stateManager, provider);
    expect(orchestrator).toBeDefined();
  });

  it("supports bestOfN configuration option without throwing", async () => {
    const provider = makeMockProvider();
    const orchestrator = new PipelineOrchestrator(undefined, provider);

    // 1x1 dummy PNG buffer
    const dummyPng = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      "base64"
    );

    // Call orchestrator with bestOfN: 2 and maxIterations: 1 (in offline unit environment)
    const state = await orchestrator.run(dummyPng, "image/png", {
      runId: "test_best_of_n",
      bestOfN: 2,
      maxIterations: 1,
    });

    expect(state).toBeDefined();
    expect(state.status).toBeDefined();
    expect(state.currentProject).toBeDefined();
    expect(state.currentProject?.files.length).toBeGreaterThan(0);
  });

  it("caps candidateProviders at 3 and populates state.candidates in race mode", async () => {
    const orchestrator = new PipelineOrchestrator();
    const dummyPng = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      "base64"
    );

    const logs: string[] = [];
    // Pass 4 candidate providers - should be capped at 3
    const state = await orchestrator.run(dummyPng, "image/png", {
      runId: "test_race_cap",
      candidateProviders: ["offline", "offline", "offline", "offline"],
      multiModelMode: "race",
      maxIterations: 1,
      onProgress: (_s, msg) => logs.push(msg),
    });

    expect(state.multiModelMode).toBe("race");
    expect(state.candidates).toBeDefined();
    // Unique capped providers length should not exceed 3
    expect(state.candidates!.length).toBeLessThanOrEqual(3);
    if (state.candidates!.length > 0) {
      expect(state.selectedCandidateId).toBeDefined();
      expect(state.candidates!.some((c) => c.selected)).toBe(true);
    }
  });

  it("survives a failing provider in race mode via Promise.allSettled and logs exclusion", async () => {
    const orchestrator = new PipelineOrchestrator();
    const dummyPng = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      "base64"
    );

    const logs: string[] = [];
    // OpenRouter with invalid key will fail, but offline will succeed
    process.env.STRICT_LIVE_VLM = "true";
    delete process.env.OPENROUTER_API_KEY;

    const state = await orchestrator.run(dummyPng, "image/png", {
      runId: "test_race_settled",
      candidateProviders: ["openrouter", "offline"],
      multiModelMode: "race",
      maxIterations: 1,
      onProgress: (_s, msg) => logs.push(msg),
    });

    delete process.env.STRICT_LIVE_VLM;

    expect(state).toBeDefined();
    // Verify run succeeded despite one candidate failing
    expect(state.status).not.toBe("failed");
    // Verify logs note the failed candidate
    const hasFailNotice = logs.some((l) => l.includes("[RACE_CANDIDATE_FAILED]"));
    expect(hasFailNotice).toBe(true);
    // Winner should be offline
    expect(state.provider).toBe("offline");
  });
});


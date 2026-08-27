import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { PipelineOrchestrator, StateManager } from "@aiui/orchestrator";

describe("Regression Suite: Real Screenshot Generalization & Multi-Panel Analysis", () => {
  it("should process real Ugeek two-panel sign-in without hardcoded fixture names or AIUI marketing text", async () => {
    const fixturePath = path.resolve(process.cwd(), "fixtures/ugeek-signin/target.png");
    expect(fs.existsSync(fixturePath)).toBe(true);

    const imageBuffer = fs.readFileSync(fixturePath);
    // Arbitrary runId with NO keyword hints
    const runId = `run_real_ugeek_${Date.now()}`;

    const orchestrator = new PipelineOrchestrator();
    const state = await orchestrator.run(imageBuffer, "image/png", {
      runId,
      name: "Uploaded Screenshot",
      target: "react",
      viewport: { width: 1280, height: 800 },
      maxIterations: 3,
      similarityThreshold: 0.90,
    });

    // 1. Verify perception correctly identified two-panel layout
    expect(state.ir).toBeDefined();
    const rootNode = state.ir!.nodes[state.ir!.rootNodeId];
    expect(rootNode).toBeDefined();
    expect(rootNode.layout?.flexDirection).toBe("row");
    expect(rootNode.childIds.length).toBe(2);

    // 2. Verify content does NOT contain AIUI self-marketing text
    const allNodeTexts = Object.values(state.ir!.nodes)
      .map((n) => n.content?.text || "")
      .join(" ");

    expect(allNodeTexts).not.toContain("AIUI Autonomous Engine");
    expect(allNodeTexts).not.toContain("Transform Screenshots Into Pixel-Perfect");
    expect(allNodeTexts).not.toContain("Structured UI IR");

    // 3. Verify sign-in form structure
    const nodeTypes = Object.values(state.ir!.nodes).map((n) => n.type);
    expect(nodeTypes).toContain("button");
    expect(nodeTypes).toContain("input");

    // 4. Verify multi-iteration execution and valid project generation
    expect(state.totalIterations).toBeGreaterThanOrEqual(1);
    expect(state.currentProject).toBeDefined();
    expect(state.similarityScore).toBeGreaterThan(0.50);

    // 5. Verify state saved on disk
    const diskState = await StateManager.loadState(runId);
    expect(diskState).toBeDefined();
  }, 120000);

  it("should generalize to a second untouched UI screenshot (Checkout & Invoice Summary)", async () => {
    const fixturePath = path.resolve(process.cwd(), "fixtures/checkout-summary/target.png");
    expect(fs.existsSync(fixturePath)).toBe(true);

    const imageBuffer = fs.readFileSync(fixturePath);
    // Arbitrary runId with NO keyword hints
    const runId = `run_real_checkout_${Date.now()}`;

    const orchestrator = new PipelineOrchestrator();
    const state = await orchestrator.run(imageBuffer, "image/png", {
      runId,
      name: "Uploaded Invoice Screenshot",
      target: "react",
      viewport: { width: 1280, height: 800 },
      maxIterations: 3,
      similarityThreshold: 0.90,
    });

    // 1. Verify IR structure
    expect(state.ir).toBeDefined();
    const nodeCount = Object.keys(state.ir!.nodes).length;
    expect(nodeCount).toBeGreaterThan(3);

    // 2. Verify content does NOT contain AIUI self-marketing text
    const allNodeTexts = Object.values(state.ir!.nodes)
      .map((n) => n.content?.text || "")
      .join(" ");

    expect(allNodeTexts).not.toContain("AIUI Autonomous Engine");
    expect(allNodeTexts).not.toContain("Transform Screenshots Into Pixel-Perfect");

    // 3. Verify project code validation and score calculation
    expect(state.currentProject).toBeDefined();
    expect(state.currentProject?.files.length).toBeGreaterThanOrEqual(3);
    expect(state.similarityScore).toBeGreaterThan(0.60);
  }, 120000);
});

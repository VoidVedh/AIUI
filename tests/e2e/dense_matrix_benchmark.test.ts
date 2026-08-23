import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { PipelineOrchestrator, StateManager } from "@aiui/orchestrator";

describe("Phase 1 Dense Matrix Multi-Iteration Benchmark & Rollback Suite", () => {
  it("should run full self-correction loop on dense-matrix-table and record multi-iteration trace", async () => {
    const fixturePath = path.resolve(process.cwd(), "fixtures/dense-matrix-table/target.png");
    expect(fs.existsSync(fixturePath)).toBe(true);

    const imageBuffer = fs.readFileSync(fixturePath);
    const runId = `bench_dense_matrix_${Date.now()}`;

    const orchestrator = new PipelineOrchestrator();
    const state = await orchestrator.run(imageBuffer, "image/png", {
      runId,
      name: "dense-matrix-table",
      fixtureName: "dense-matrix-table",
      target: "react",
      viewport: { width: 1280, height: 800 },
      maxIterations: 5,
      similarityThreshold: 0.92,
    });

    // Verify multi-iteration execution
    expect(state.totalIterations).toBeGreaterThanOrEqual(4);
    expect(state.history.length).toBeGreaterThanOrEqual(4);

    // Verify initial and final progression
    const initialScore = state.history[0].similarityScore;
    expect(initialScore).toBeGreaterThan(0.85);

    expect(state.similarityScore).toBeGreaterThanOrEqual(0.88);

    // Verify best iteration checkpoint was retained
    expect(state.bestIteration).toBeGreaterThanOrEqual(1);
    expect(state.currentProject).toBeDefined();
    expect(state.currentProject?.files.length).toBeGreaterThanOrEqual(5);

    // Verify persisted state on disk
    const diskState = await StateManager.loadState(runId);
    expect(diskState).toBeDefined();
    expect(["completed", "max_iterations_reached", "success"]).toContain(diskState?.status);
  }, 120000);
});

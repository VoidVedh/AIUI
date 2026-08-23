import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { PipelineOrchestrator } from "@aiui/orchestrator";

describe("Phase 1 P0 React End-to-End Benchmark Suite", () => {
  const fixtures = [
    { name: "landing-page", path: "fixtures/landing-page/target.png", viewport: { width: 1280, height: 800 } },
    { name: "dashboard", path: "fixtures/dashboard/target.png", viewport: { width: 1280, height: 800 } },
    { name: "form-ui", path: "fixtures/form-ui/target.png", viewport: { width: 1280, height: 800 } },
    { name: "card-ui", path: "fixtures/card-ui/target.png", viewport: { width: 1280, height: 800 } },
    { name: "mobile-ui", path: "fixtures/mobile-ui/target.png", viewport: { width: 390, height: 844 } },
  ];

  for (const fixture of fixtures) {
    it(
      `should run full loop on ${fixture.name} and reach similarity >= 0.92`,
      async () => {
        const imageBuffer = fs.readFileSync(path.resolve(process.cwd(), fixture.path));
        const orchestrator = new PipelineOrchestrator();

        const result = await orchestrator.run(imageBuffer, "image/png", {
          runId: `bench_${fixture.name}`,
          target: "react",
          maxIterations: 5,
          similarityThreshold: 0.92,
          viewport: fixture.viewport,
          onProgress: (state, log) => {
            console.log(`[${fixture.name}] ${log}`);
          },
        });

        expect(result.status).toBe("success");
        expect(result.similarityScore).toBeGreaterThanOrEqual(0.92);
        expect(result.history.length).toBeGreaterThan(0);
        expect(result.bestProject).toBeDefined();

        // Verify generated code files exist in project
        const appFile = result.bestProject?.files.find((f) => f.path === "src/App.jsx");
        const cssFile = result.bestProject?.files.find((f) => f.path === "src/index.css");
        expect(appFile).toBeDefined();
        expect(cssFile).toBeDefined();

        console.log(
          `✓ Benchmark ${fixture.name} PASSED in ${result.totalIterations} iteration(s) with final score: ${(result.similarityScore * 100).toFixed(1)}%`
        );
      },
      90000 // 90s timeout per benchmark fixture
    );
  }
});

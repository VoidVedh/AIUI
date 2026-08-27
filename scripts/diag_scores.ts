import fs from "node:fs";
import path from "node:path";
import { PipelineOrchestrator } from "@aiui/orchestrator";

async function testCurrentScores() {
  console.log("=== Testing Current Scores for Ugeek & Checkout ===");

  const fixtures = [
    { name: "ugeek-signin", path: "fixtures/ugeek-signin/target.png", viewport: { width: 1280, height: 800 } },
    { name: "checkout-summary", path: "fixtures/checkout-summary/target.png", viewport: { width: 1280, height: 800 } }
  ];

  for (const f of fixtures) {
    const buf = fs.readFileSync(path.resolve(process.cwd(), f.path));
    const orch = new PipelineOrchestrator();
    console.log(`\n--- Running ${f.name} ---`);
    const res = await orch.run(buf, "image/png", {
      runId: `diag_${f.name}`,
      target: "react",
      viewport: f.viewport,
      maxIterations: 3,
      similarityThreshold: 0.90,
      onProgress: (state, log) => console.log(`[${f.name}] ${log}`)
    });

    console.log(`Result for ${f.name}:`);
    console.log(`- Final Similarity Score: ${(res.similarityScore * 100).toFixed(1)}%`);
    console.log(`- Best Iteration: ${res.bestIteration}`);
    console.log(`- Total Iterations: ${res.totalIterations}`);
    console.log(`- Status: ${res.status}`);
    if (res.history && res.history.length > 0) {
      console.log(`- Iteration Breakdown:`);
      for (const h of res.history) {
        console.log(`  Iter ${h.iteration}: Overall=${(h.similarityScore * 100).toFixed(1)}%, SSIM=${((h.ssimScore || 0) * 100).toFixed(1)}%, PixelMatch=${((h.pixelMatchScore || 0) * 100).toFixed(1)}%, LayoutIOU=${((h.layoutIouScore || 0) * 100).toFixed(1)}%`);
      }
    }
  }
}

testCurrentScores().catch(console.error);

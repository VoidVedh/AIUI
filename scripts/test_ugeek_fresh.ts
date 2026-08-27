import fs from "node:fs";
import { PipelineOrchestrator } from "./packages/orchestrator/dist/index.js";

async function testUgeek() {
  const buf = fs.readFileSync("fixtures/ugeek-signin/target.png");
  const orch = new PipelineOrchestrator();
  const res = await orch.run(buf, "image/png", {
    runId: "test_ugeek_fresh",
    target: "react",
    viewport: { width: 1280, height: 800 },
    maxIterations: 1,
    similarityThreshold: 0.90,
    onProgress: (state, log) => console.log(log),
  });

  console.log("Final Similarity Score:", (res.similarityScore * 100).toFixed(1) + "%");
  console.log("SSIM:", (res.history[0]?.ssimScore * 100).toFixed(1) + "%");
  console.log("PixelMatch:", (res.history[0]?.pixelMatchScore * 100).toFixed(1) + "%");
  console.log("LayoutIOU:", (res.history[0]?.layoutIouScore * 100).toFixed(1) + "%");
}

testUgeek().catch(console.error);

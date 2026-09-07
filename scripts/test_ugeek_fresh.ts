import fs from "node:fs";
import path from "node:path";
import { PipelineOrchestrator } from "@aiui/orchestrator";

async function testUgeek() {
  const targetPath = fs.existsSync("benchmarks/internal/ugeek-signin/target.png")
    ? "benchmarks/internal/ugeek-signin/target.png"
    : "fixtures/ugeek-signin/target.png";

  const buf = fs.readFileSync(targetPath);
  const runId = `test_ugeek_${Date.now()}`;
  const orch = new PipelineOrchestrator();

  console.log(`[Test] Running pipeline on ${targetPath} (runId: ${runId})...`);

  const res = await orch.run(buf, "image/png", {
    runId,
    fixtureName: "ugeek-signin",
    target: "react",
    viewport: { width: 1280, height: 800 },
    maxIterations: 2,
    similarityThreshold: 0.90,
    onProgress: (state, log) => console.log(`[Progress] [${state.currentStage}] ${log}`),
  });

  const lastCheckpoint = res.history[res.history.length - 1];

  console.log("\n=================== VERIFIED SCORES ===================");
  console.log("Overall Score: " + (res.similarityScore * 100).toFixed(2) + "%");
  console.log("MSSIM: " + ((lastCheckpoint?.ssimScore ?? 0) * 100).toFixed(2) + "%");
  console.log("PixelMatch: " + ((lastCheckpoint?.pixelMatchScore ?? 0) * 100).toFixed(2) + "%");
  console.log("Layout IoU: " + ((lastCheckpoint?.layoutIouScore ?? 0) * 100).toFixed(2) + "%");
  console.log("Total Iterations: " + res.totalIterations);
  console.log("Status: " + res.status);
  console.log("========================================================\n");

  if (res.currentProject) {
    console.log("Generated Files:");
    for (const file of res.currentProject.files) {
      console.log(`- ${file.path} (${file.content.length} chars)`);
    }

    const appFile = res.currentProject.files.find((f) => f.path.endsWith("App.jsx"));
    const cssFile = res.currentProject.files.find((f) => f.path.endsWith("index.css"));

    if (appFile) {
      console.log("\n--- Generated App.jsx snippet ---");
      console.log(appFile.content.slice(0, 800));
    }
    if (cssFile) {
      console.log("\n--- Generated index.css snippet ---");
      console.log(cssFile.content.slice(0, 600));
    }
  }

  const { PlaywrightRenderer } = await import("@aiui/runner");
  await PlaywrightRenderer.closeBrowser();
  process.exit(0);
}

testUgeek().catch((err) => {
  console.error("[Test Error]", err);
  process.exit(1);
});

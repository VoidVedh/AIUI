import fs from "node:fs";
import path from "node:path";
import { PipelineOrchestrator } from "@aiui/orchestrator";

async function main() {
  const imagePath = path.resolve(process.cwd(), "scratch/live_sample_ui.png");
  if (!fs.existsSync(imagePath)) {
    throw new Error(`Sample image not found at ${imagePath}`);
  }

  const imageBuffer = fs.readFileSync(imagePath);
  const outDir = path.resolve(process.cwd(), "scratch/demo_output");
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  console.log("===============================================================");
  console.log("AIUI LIVE DEMO RUN: VITE HOMEPAGE SCREENSHOT");
  console.log("===============================================================\n");

  const orchestrator = new PipelineOrchestrator();
  const start = Date.now();

  const result = await orchestrator.run(imageBuffer, "image/png", {
    runId: "live_demo_vite",
    name: "vite_homepage_demo",
    target: "react",
    viewport: { width: 1280, height: 800 },
    maxIterations: 4,
    similarityThreshold: 0.92,
    onProgress: (state, log) => {
      console.log(`[Stage: ${state.currentStage}] ${log}`);
    },
  });

  const durationSec = ((Date.now() - start) / 1000).toFixed(1);
  console.log("\n===============================================================");
  console.log("PIPELINE EXECUTION COMPLETED");
  console.log("===============================================================");
  console.log(`Status:            ${result.status}`);
  console.log(`Final Similarity:  ${(result.similarityScore * 100).toFixed(1)}%`);
  console.log(`Best Iteration:    ${result.bestIteration} / ${result.totalIterations}`);
  console.log(`Duration:          ${durationSec}s`);

  // Write out the best generated project code
  if (result.bestProject) {
    const codeDir = path.join(outDir, "generated_code");
    if (!fs.existsSync(codeDir)) {
      fs.mkdirSync(codeDir, { recursive: true });
    }
    for (const file of result.bestProject.files) {
      const filePath = path.join(codeDir, file.path);
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, file.content, "utf-8");
    }
    console.log(`Saved generated React code files to: ${codeDir}`);
  }

  // Copy artifacts to demo_output
  const lastCheckpoint = result.history[result.history.length - 1];
  if (lastCheckpoint) {
    console.log(`\nMetrics:`);
    console.log(`- MSSIM Score:     ${(lastCheckpoint.ssimScore * 100).toFixed(1)}%`);
    console.log(`- Layout IoU:      ${(lastCheckpoint.layoutIouScore * 100).toFixed(1)}%`);
    console.log(`- Pixel Match:     ${(lastCheckpoint.pixelMatchScore * 100).toFixed(1)}%`);

    if (fs.existsSync(lastCheckpoint.screenshotArtifactPath)) {
      const destRender = path.join(outDir, "rendered_output.png");
      fs.copyFileSync(lastCheckpoint.screenshotArtifactPath, destRender);
      console.log(`Rendered Output:   ${destRender}`);
    }
    if (fs.existsSync(lastCheckpoint.diffArtifactPath)) {
      const destDiff = path.join(outDir, "visual_diff.png");
      fs.copyFileSync(lastCheckpoint.diffArtifactPath, destDiff);
      console.log(`Visual Diff:       ${destDiff}`);
    }
  }
}

main().catch(console.error);

import fs from "node:fs";
import path from "node:path";
import "dotenv/config";
import { PipelineOrchestrator } from "../packages/orchestrator/src/orchestrator.js";
import { SupportedProviderName } from "../packages/orchestrator/src/types.js";

async function runTestOnImage(
  imagePath: string,
  targetName: string,
  provider: SupportedProviderName = "gemma",
  maxIterations = 3
) {
  console.log("\n================================================================================");
  console.log(`🎯 STARTING RUN ON RANDOM HIGH-UI TARGET: ${targetName}`);
  console.log(`   Source: ${imagePath}`);
  console.log(`   Provider: ${provider} (Model: ${process.env.GEMMA_MODEL})`);
  console.log(`   Max Iterations: ${maxIterations}`);
  console.log("================================================================================");

  if (!fs.existsSync(imagePath)) {
    throw new Error(`Image not found: ${imagePath}`);
  }

  const imageBuffer = fs.readFileSync(imagePath);
  const runId = `run_${targetName.toLowerCase().replace(/[^a-z0-9]/g, "_")}_${Date.now()}`;

  const orchestrator = new PipelineOrchestrator();

  const startTime = Date.now();
  const finalState = await orchestrator.run(imageBuffer, "image/png", {
    runId,
    fixtureName: targetName,
    providerName: provider,
    maxIterations,
    similarityThreshold: 0.95,
    viewport: { width: 1280, height: 800 },
    onProgress: (state, msg) => {
      console.log(`[PIPELINE] ${msg}`);
    },
  });

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log("\n--------------------------------------------------------------------------------");
  console.log(`🏁 FINISHED RUN: ${targetName} (${durationSec}s)`);
  console.log(`   Final Stage: ${finalState.currentStage}`);
  console.log(`   Total Iterations: ${finalState.totalIterations}`);
  console.log(`   Best Iteration: ${finalState.bestIteration}`);
  console.log(`   Best Score: ${(finalState.similarityScore * 100).toFixed(1)}%`);
  console.log(`   Provider: ${finalState.provider}`);
  console.log(`   Total Cost: $${finalState.totalCostUsd?.toFixed(6) || 0}`);
  console.log(`   Total Tokens (In/Out): ${finalState.totalTokensIn || 0} / ${finalState.totalTokensOut || 0}`);

  if (finalState.history && finalState.history.length > 0) {
    console.log("\n📊 Iteration Trajectory:");
    finalState.history.forEach((iter) => {
      console.log(
        `   Iter ${iter.iteration}: Score=${(iter.score * 100).toFixed(1)}% ` +
        `[SSIM: ${(iter.ssimScore * 100).toFixed(1)}%, PixelMatch: ${(iter.pixelMatchScore * 100).toFixed(1)}%, LayoutIoU: ${(iter.layoutIouScore * 100).toFixed(1)}%]`
      );
    });
  }

  // Inspect generated code files
  if (finalState.bestProject && finalState.bestProject.files) {
    console.log(`\n📁 Generated Files (${finalState.bestProject.files.length}):`);
    finalState.bestProject.files.forEach((f) => {
      console.log(`   - ${f.path} (${f.content.length} chars)`);
    });

    const appFile = finalState.bestProject.files.find((f) => f.path.includes("App.tsx") || f.path.includes("index.tsx"));
    if (appFile) {
      console.log("\n📝 App Component Preview (first 25 lines):");
      console.log(appFile.content.split("\n").slice(0, 25).join("\n"));
    }
  }

  return {
    targetName,
    runId,
    bestScore: finalState.similarityScore,
    bestIteration: finalState.bestIteration,
    totalIterations: finalState.totalIterations,
    history: finalState.history,
    vlmError: (finalState.ir?.metadata as any)?.vlmError,
    nodeCount: finalState.ir?.nodes ? Object.keys(finalState.ir.nodes).length : 0,
    cost: finalState.totalCostUsd,
    durationSec,
  };
}

async function main() {
  const capturedDir = path.resolve(process.cwd(), "captured_uis");
  const availableImages = fs.readdirSync(capturedDir).filter((f) => f.endsWith(".png"));

  if (availableImages.length === 0) {
    console.error("No captured images found in", capturedDir);
    process.exit(1);
  }

  // Shuffle available images to ensure true random selection
  const shuffled = [...availableImages].sort(() => 0.5 - Math.random());
  
  // Pick 2 distinct random high-UI targets
  const selectedTargets = shuffled.slice(0, 2);

  console.log("==================================================");
  console.log("🎲 AIUI RANDOM HIGH-UI VERIFICATION TEST");
  console.log(`   Available Pool: ${availableImages.join(", ")}`);
  console.log(`   Randomly Selected: ${selectedTargets.join(", ")}`);
  console.log("==================================================");

  const results: any[] = [];

  for (const imgName of selectedTargets) {
    const targetPath = path.join(capturedDir, imgName);
    const targetId = path.basename(imgName, ".png");
    try {
      const res = await runTestOnImage(targetPath, targetId, "gemma", 3);
      results.push(res);
    } catch (err: any) {
      console.error(`❌ Error running target ${targetId}:`, err);
      results.push({ targetName: targetId, error: err.message });
    }
  }

  console.log("\n================================================================================");
  console.log("🏆 FINAL MULTI-TARGET ACCURACY REPORT");
  console.log("================================================================================");
  console.table(
    results.map((r) => ({
      Target: r.targetName,
      "VLM Provider": "Gemma 3 (Live)",
      "Node Count": r.nodeCount || 0,
      "Best Score": r.bestScore ? `${(r.bestScore * 100).toFixed(1)}%` : "N/A",
      "Best Iter": r.bestIteration ?? "N/A",
      "VLM Fallback?": r.vlmError ? `YES (${r.vlmError})` : "NO (100% Live VLM)",
      Duration: `${r.durationSec}s`,
    }))
  );
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

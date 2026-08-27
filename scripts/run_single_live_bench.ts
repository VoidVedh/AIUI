import fs from "node:fs";
import path from "node:path";
import "dotenv/config";
import { PipelineOrchestrator, createProvider, OpenRouterProvider } from "@aiui/orchestrator";

// Enforce strict live mode
process.env.STRICT_LIVE_VLM = "true";

async function runBenchmark(fixtureName: string) {
  console.log("===============================================================");
  console.log(`AIUI — LIVE BENCHMARK EXECUTION: ${fixtureName}`);
  console.log("===============================================================\n");

  console.log("Configuration:");
  console.log("- OPENROUTER_API_KEY present:", !!process.env.OPENROUTER_API_KEY);
  console.log("- OPENROUTER_MODEL:", process.env.OPENROUTER_MODEL || "openrouter/free");
  console.log("- OPENROUTER_MAX_TOKENS:", process.env.OPENROUTER_MAX_TOKENS || "2000");
  console.log("- STRICT_LIVE_VLM:", process.env.STRICT_LIVE_VLM);

  const fixturePath = path.resolve(process.cwd(), `fixtures/${fixtureName}/target.png`);
  if (!fs.existsSync(fixturePath)) {
    throw new Error(`Fixture path not found: ${fixturePath}`);
  }

  const imageBuffer = fs.readFileSync(fixturePath);
  const runId = `live_bench_${fixtureName}_${Date.now()}`;
  const provider = new OpenRouterProvider(undefined, undefined, false); // allowFallback: false

  console.log(`\nStarting pipeline run for ${fixtureName} (RunId: ${runId})...`);

  const orch = new PipelineOrchestrator(undefined, provider);
  const state = await orch.run(imageBuffer, "image/png", {
    runId,
    fixtureName,
    target: "react",
    viewport: { width: 1280, height: 800 },
    maxIterations: 5,
    similarityThreshold: 0.92,
    onProgress: (st, log) => {
      console.log(`[PROGRESS] ${log}`);
    },
  });

  console.log(`\n===============================================================`);
  console.log(`COMPLETED BENCHMARK: ${fixtureName}`);
  console.log(`===============================================================`);
  console.log(`Final Status: ${state.status}`);
  console.log(`Final Similarity Score: ${state.similarityScore}`);
  console.log(`Best Iteration: ${state.bestIteration}`);
  console.log(`Total Iterations: ${state.totalIterations}`);
  console.log(`Total Tokens In: ${state.totalTokensIn}`);
  console.log(`Total Tokens Out: ${state.totalTokensOut}`);
  console.log(`Total Cost USD: $${state.totalCostUsd.toFixed(6)}`);

  console.log("\nCost Logs / Provider Evidence:");
  for (const l of state.costLogs) {
    console.log(JSON.stringify(l, null, 2));
  }

  const fallbackLogs = state.costLogs.filter((l: any) => l.provider.includes("fallback") || l.provider.includes("offline"));
  console.log(`\nFallback Used: ${fallbackLogs.length > 0 ? "YES" : "NO"}`);

  console.log("\nIteration History:");
  for (const h of state.history) {
    console.log(`- Iteration ${h.iteration}: Similarity=${h.similarityScore} (SSIM=${h.ssimScore}, PixelMatch=${h.pixelMatchScore}, LayoutIoU=${h.layoutIouScore}) - Issues=${h.issues.length}`);
  }

  // Save detailed result
  fs.mkdirSync("scratch", { recursive: true });
  fs.writeFileSync(`scratch/${fixtureName}_live_result.json`, JSON.stringify(state, null, 2));
  console.log(`\nSaved result to scratch/${fixtureName}_live_result.json`);

  return state;
}

const targetFixture = process.argv[2] || "card-ui";
runBenchmark(targetFixture).catch((err) => {
  console.error("Benchmark run failed:", err);
  process.exit(1);
});

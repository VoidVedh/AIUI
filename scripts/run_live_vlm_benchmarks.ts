import fs from "node:fs";
import path from "node:path";
import "dotenv/config";
import { PipelineOrchestrator } from "@aiui/orchestrator";
import { createProvider, OpenRouterProvider } from "@aiui/orchestrator";

async function main() {
  console.log("===============================================================");
  console.log("AIUI — LIVE OPENROUTER VLM BENCHMARK EXECUTION & VERIFICATION");
  console.log("===============================================================\n");

  // Step 1: Verify Provider Configuration & Live Connectivity
  console.log("--- 1. VERIFYING LIVE OPENROUTER PROVIDER ---");
  console.log("OPENROUTER_API_KEY present in env:", !!process.env.OPENROUTER_API_KEY);
  console.log("OPENAI_API_KEY present in env:", !!process.env.OPENAI_API_KEY);
  console.log("OPENROUTER_MODEL:", process.env.OPENROUTER_MODEL || "openai/gpt-4o (default)");

  const provider = createProvider();
  console.log("Provider instantiated:", provider.name);
  if (provider.name !== "openrouter") {
    console.error(`ERROR: Expected provider 'openrouter', got '${provider.name}'`);
    process.exit(1);
  }

  const benchmarks = [
    { name: "ugeek-signin", path: "fixtures/ugeek-signin/target.png", viewport: { width: 1280, height: 800 } },
    { name: "dashboard", path: "fixtures/dashboard/target.png", viewport: { width: 1280, height: 800 } },
    { name: "card-ui", path: "fixtures/card-ui/target.png", viewport: { width: 1280, height: 800 } },
    { name: "form-ui", path: "fixtures/form-ui/target.png", viewport: { width: 1280, height: 800 } },
  ];

  const allResults: Record<string, any> = {};

  for (const b of benchmarks) {
    const fullPath = path.resolve(process.cwd(), b.path);
    if (!fs.existsSync(fullPath)) {
      console.error(`Missing fixture file: ${fullPath}`);
      continue;
    }

    const imageBuffer = fs.readFileSync(fullPath);
    const runId = `live_bench_${b.name}_${Date.now()}`;
    console.log(`\n===============================================================`);
    console.log(`STARTING BENCHMARK: ${b.name} (Run ID: ${runId})`);
    console.log(`===============================================================`);

    const orch = new PipelineOrchestrator(undefined, createProvider("openrouter"));
    const state = await orch.run(imageBuffer, "image/png", {
      runId,
      fixtureName: b.name,
      target: "react",
      viewport: b.viewport,
      maxIterations: 5,
      similarityThreshold: 0.92,
      onProgress: (st, log) => {
        console.log(`[${b.name}] ${log}`);
      },
    });

    allResults[b.name] = state;

    console.log(`\n--- BENCHMARK FINISHED: ${b.name} ---`);
    console.log(`Status: ${state.status}`);
    console.log(`Final Similarity Score: ${state.similarityScore}`);
    console.log(`Best Iteration: ${state.bestIteration}`);
    console.log(`Total Iterations: ${state.totalIterations}`);
    console.log(`Total VLM Calls / Cost Logs: ${state.costLogs.length}`);
    console.log(`Total Tokens In: ${state.totalTokensIn}`);
    console.log(`Total Tokens Out: ${state.totalTokensOut}`);
    console.log(`Total Cost USD: $${state.totalCostUsd.toFixed(6)}`);

    // Check if fallback was used
    const fallbackLogs = state.costLogs.filter((l: any) => l.provider.includes("fallback") || l.provider.includes("offline"));
    console.log(`Fallback Used: ${fallbackLogs.length > 0 ? "YES" : "NO"}`);
    if (fallbackLogs.length > 0) {
      console.log("Fallback log details:", fallbackLogs);
    }
  }

  // Write full summary to scratch
  fs.mkdirSync("scratch", { recursive: true });
  fs.writeFileSync("scratch/live_benchmark_results.json", JSON.stringify(allResults, null, 2));
  console.log("\nSaved all live benchmark results to scratch/live_benchmark_results.json");
}

main().catch((err) => {
  console.error("Live Benchmark run failed:", err);
  process.exit(1);
});

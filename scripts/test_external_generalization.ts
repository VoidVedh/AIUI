import fs from "node:fs";
import path from "node:path";
import "dotenv/config";
import { PipelineOrchestrator, OpenRouterProvider } from "@aiui/orchestrator";

process.env.STRICT_LIVE_VLM = "true";

interface BenchResult {
  fixture: string;
  fidelityScore: number;
  ssimScore: number;
  pixelMatchScore: number;
  layoutIouScore: number;
  bestIteration: number;
  tokensIn: number;
  tokensOut: number;
  costUsd: number;
  passed: boolean;
}

async function runTest(fixtureName: string): Promise<BenchResult> {
  console.log(`\n===============================================================`);
  console.log(`BENCHMARKING: ${fixtureName}`);
  console.log(`===============================================================`);

  const fixturePath = path.resolve(process.cwd(), `fixtures/${fixtureName}/target.png`);
  if (!fs.existsSync(fixturePath)) {
    throw new Error(`Fixture not found: ${fixturePath}`);
  }

  const imageBuffer = fs.readFileSync(fixturePath);
  const runId = `bench_gen_${fixtureName}_${Date.now()}`;
  const provider = new OpenRouterProvider(undefined, undefined, false);
  const orchestrator = new PipelineOrchestrator(undefined, provider);

  const state = await orchestrator.run(imageBuffer, "image/png", {
    runId,
    fixtureName,
    target: "react",
    viewport: { width: 1280, height: 800 },
    maxIterations: 5,
    similarityThreshold: 0.92,
    onProgress: (_st, log) => {
      console.log(`[${fixtureName}] ${log}`);
    },
  });

  const bestCheckpoint = state.history.find((h) => h.iteration === state.bestIteration) || state.history[0];

  const result: BenchResult = {
    fixture: fixtureName,
    fidelityScore: state.similarityScore,
    ssimScore: bestCheckpoint?.ssimScore || 0,
    pixelMatchScore: bestCheckpoint?.pixelMatchScore || 0,
    layoutIouScore: bestCheckpoint?.layoutIouScore || 1.0,
    bestIteration: state.bestIteration,
    tokensIn: state.totalTokensIn,
    tokensOut: state.totalTokensOut,
    costUsd: state.totalCostUsd,
    passed: state.similarityScore >= 0.88,
  };

  console.log(`\nResult for ${fixtureName}:`);
  console.log(`- Final Fidelity Score: ${(result.fidelityScore * 100).toFixed(1)}%`);
  console.log(`- MSSIM (45%):           ${(result.ssimScore * 100).toFixed(1)}%`);
  console.log(`- Layout IoU (35%):       ${(result.layoutIouScore * 100).toFixed(1)}%`);
  console.log(`- Masked PixelMatch (20%): ${(result.pixelMatchScore * 100).toFixed(1)}%`);
  console.log(`- Best Iteration:        ${result.bestIteration} of ${state.totalIterations}`);
  console.log(`- Telemetry:             ${result.tokensIn} in / ${result.tokensOut} out | $${result.costUsd.toFixed(6)}`);

  return result;
}

async function main() {
  const targets = ["card-ui", "landing-page", "dense-matrix-table"];
  const results: BenchResult[] = [];

  for (const t of targets) {
    try {
      const res = await runTest(t);
      results.push(res);
    } catch (err: any) {
      console.error(`Failed ${t}:`, err.message);
    }
  }

  console.log(`\n===============================================================`);
  console.log(`GENERALIZATION BENCHMARK SUMMARY REPORT`);
  console.log(`===============================================================`);
  console.table(
    results.map((r) => ({
      Fixture: r.fixture,
      "Fidelity Score": `${(r.fidelityScore * 100).toFixed(1)}%`,
      "MSSIM (45%)": `${(r.ssimScore * 100).toFixed(1)}%`,
      "Layout IoU (35%)": `${(r.layoutIouScore * 100).toFixed(1)}%`,
      "PixelMatch (20%)": `${(r.pixelMatchScore * 100).toFixed(1)}%`,
      "Best Iter": r.bestIteration,
      Cost: `$${r.costUsd.toFixed(4)}`,
    }))
  );
}

main().catch((err) => {
  console.error("Benchmark suite error:", err);
  process.exit(1);
});

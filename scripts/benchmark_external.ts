import fs from "node:fs";
import path from "node:path";
import "dotenv/config";
import { PNG } from "pngjs";
import { PipelineOrchestrator, OpenRouterProvider } from "@aiui/orchestrator";

export interface ExternalBenchResult {
  fixture: string;
  width: number;
  height: number;
  fidelityScore: number;
  ssimScore: number;
  layoutIouScore: number;
  pixelMatchScore: number;
  bestIteration: number;
  totalIterations: number;
  tokensIn: number;
  tokensOut: number;
  costUsd: number;
  latencyMs: number;
}

export async function runExternalBenchmark(): Promise<{
  results: ExternalBenchResult[];
  meanScore: number;
  minScore: number;
  maxScore: number;
}> {
  const externalDir = path.resolve(process.cwd(), "fixtures-external");
  if (!fs.existsSync(externalDir)) {
    throw new Error(`External fixtures directory not found: ${externalDir}`);
  }

  const entries = fs.readdirSync(externalDir, { withFileTypes: true });
  const fixtureDirs = entries.filter((e) => e.isDirectory()).map((e) => e.name).sort();

  console.log(`\n===============================================================`);
  console.log(`RUNNING EXTERNAL GENERALIZATION BENCHMARK ON ${fixtureDirs.length} HELD-OUT TARGETS`);
  console.log(`===============================================================`);

  const results: ExternalBenchResult[] = [];
  const provider = new OpenRouterProvider(undefined, undefined, true);

  for (const fixtureName of fixtureDirs) {
    const targetPath = path.join(externalDir, fixtureName, "target.png");
    if (!fs.existsSync(targetPath)) {
      console.warn(`[SKIP] Missing target.png in ${fixtureName}`);
      continue;
    }

    const imageBuffer = fs.readFileSync(targetPath);
    let width = 1280;
    let height = 800;
    try {
      const parsedPng = PNG.sync.read(imageBuffer);
      width = parsedPng.width;
      height = parsedPng.height;
    } catch {
      // default viewport
    }

    const startTime = Date.now();
    const runId = `bench_ext_${fixtureName}_${Date.now()}`;
    const orchestrator = new PipelineOrchestrator(undefined, provider);

    console.log(`\n--> Benchmarking: ${fixtureName} (${width}x${height})`);

    const state = await orchestrator.run(imageBuffer, "image/png", {
      runId,
      name: fixtureName,
      target: "react",
      viewport: { width, height },
      maxIterations: 5,
      similarityThreshold: 0.92,
      onProgress: (_st, log) => {
        console.log(`  [${fixtureName}] ${log}`);
      },
    });

    const bestCheckpoint =
      state.history.find((h) => h.iteration === state.bestIteration) || state.history[state.history.length - 1] || state.history[0];

    const result: ExternalBenchResult = {
      fixture: fixtureName,
      width,
      height,
      fidelityScore: state.similarityScore,
      ssimScore: bestCheckpoint?.ssimScore || 0,
      layoutIouScore: bestCheckpoint?.layoutIouScore || 1.0,
      pixelMatchScore: bestCheckpoint?.pixelMatchScore || 0,
      bestIteration: state.bestIteration,
      totalIterations: state.totalIterations,
      tokensIn: state.totalTokensIn,
      tokensOut: state.totalTokensOut,
      costUsd: state.totalCostUsd,
      latencyMs: Date.now() - startTime,
    };

    results.push(result);
  }

  const scores = results.map((r) => r.fidelityScore);
  const meanScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  const minScore = scores.length > 0 ? Math.min(...scores) : 0;
  const maxScore = scores.length > 0 ? Math.max(...scores) : 0;

  console.log(`\n===============================================================`);
  console.log(`EXTERNAL HELD-OUT BENCHMARK SUMMARY REPORT`);
  console.log(`===============================================================`);
  console.table(
    results.map((r) => ({
      Fixture: r.fixture,
      "Fidelity Score": `${(r.fidelityScore * 100).toFixed(1)}%`,
      "MSSIM (45%)": `${(r.ssimScore * 100).toFixed(1)}%`,
      "Layout IoU (35%)": `${(r.layoutIouScore * 100).toFixed(1)}%`,
      "PixelMatch (20%)": `${(r.pixelMatchScore * 100).toFixed(1)}%`,
      "Best Iter": `${r.bestIteration}/${r.totalIterations}`,
      Latency: `${(r.latencyMs / 1000).toFixed(1)}s`,
    }))
  );

  console.log(`\nAggregates across ${results.length} held-out targets:`);
  console.log(`- MEAN Fidelity Score: ${(meanScore * 100).toFixed(1)}%`);
  console.log(`- MIN Fidelity Score:  ${(minScore * 100).toFixed(1)}%`);
  console.log(`- MAX Fidelity Score:  ${(maxScore * 100).toFixed(1)}%`);

  return { results, meanScore, minScore, maxScore };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runExternalBenchmark().catch((err) => {
    console.error("External benchmark failed:", err);
    process.exit(1);
  });
}

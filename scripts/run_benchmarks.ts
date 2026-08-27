import fs from "node:fs";
import path from "node:path";
import { PipelineOrchestrator } from "@aiui/orchestrator";

interface BenchmarkResult {
  fixture: string;
  score: number;
  ssim: number;
  iou: number;
  pixelMatch: number;
  bestIter: number;
  totalIters: number;
  status: string;
  latencySec: number;
}

async function runAll() {
  const fixtures = [
    { name: "landing-page", path: "fixtures/landing-page/target.png", viewport: { width: 1280, height: 800 } },
    { name: "dashboard", path: "fixtures/dashboard/target.png", viewport: { width: 1280, height: 800 } },
    { name: "form-ui", path: "fixtures/form-ui/target.png", viewport: { width: 1280, height: 800 } },
    { name: "card-ui", path: "fixtures/card-ui/target.png", viewport: { width: 1280, height: 800 } },
    { name: "mobile-ui", path: "fixtures/mobile-ui/target.png", viewport: { width: 390, height: 844 } },
    { name: "dense-matrix-table", path: "fixtures/dense-matrix-table/target.png", viewport: { width: 1280, height: 800 } },
    { name: "checkout-summary", path: "fixtures/checkout-summary/target.png", viewport: { width: 1280, height: 800 } },
    { name: "ugeek-signin", path: "fixtures/ugeek-signin/target.png", viewport: { width: 1280, height: 800 } },
  ];

  const results: BenchmarkResult[] = [];

  console.log("===============================================================");
  console.log("INTERNAL BENCHMARK RUNNER (8 SELF-CONTAINED FIXTURES)");
  console.log("===============================================================\n");

  for (const f of fixtures) {
    const fullPath = path.resolve(process.cwd(), f.path);
    if (!fs.existsSync(fullPath)) continue;

    const buf = fs.readFileSync(fullPath);
    const orch = new PipelineOrchestrator();
    const start = Date.now();

    console.log(`[Benchmarking] Running ${f.name}...`);
    const res = await orch.run(buf, "image/png", {
      runId: `bench_internal_${f.name}`,
      target: "react",
      viewport: f.viewport,
      maxIterations: 5,
      similarityThreshold: 0.92,
    });

    const elapsed = (Date.now() - start) / 1000;
    const lastCheckpoint = res.history[res.history.length - 1];

    results.push({
      fixture: f.name,
      score: res.similarityScore,
      ssim: lastCheckpoint?.ssimScore || 0,
      iou: lastCheckpoint?.layoutIouScore || 0,
      pixelMatch: lastCheckpoint?.pixelMatchScore || 0,
      bestIter: res.bestIteration,
      totalIters: res.totalIterations,
      status: res.status,
      latencySec: Number(elapsed.toFixed(1)),
    });
  }

  console.log("\n===============================================================");
  console.log("INTERNAL BENCHMARK SUMMARY REPORT");
  console.log("===============================================================");
  console.table(
    results.map((r) => ({
      Fixture: r.fixture,
      "Fidelity Score": `${(r.score * 100).toFixed(1)}%`,
      "MSSIM (45%)": `${(r.ssim * 100).toFixed(1)}%`,
      "Layout IoU (35%)": `${(r.iou * 100).toFixed(1)}%`,
      "PixelMatch (20%)": `${(r.pixelMatch * 100).toFixed(1)}%`,
      "Best Iter": `${r.bestIter}/${r.totalIters}`,
      Latency: `${r.latencySec}s`,
    }))
  );

  const meanScore = results.reduce((acc, r) => acc + r.score, 0) / (results.length || 1);
  const minScore = Math.min(...results.map((r) => r.score));
  const maxScore = Math.max(...results.map((r) => r.score));

  console.log(`Aggregates across ${results.length} internal fixtures:`);
  console.log(`- MEAN Fidelity Score: ${(meanScore * 100).toFixed(1)}%`);
  console.log(`- MIN Fidelity Score:  ${(minScore * 100).toFixed(1)}%`);
  console.log(`- MAX Fidelity Score:  ${(maxScore * 100).toFixed(1)}%\n`);
}

runAll().catch(console.error);

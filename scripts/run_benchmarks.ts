import fs from "node:fs";
import path from "node:path";
import { PipelineOrchestrator } from "@aiui/orchestrator";

async function runAll() {
  const fixtures = [
    { name: "landing-page", path: "fixtures/landing-page/target.png", viewport: { width: 1280, height: 800 } },
    { name: "dashboard", path: "fixtures/dashboard/target.png", viewport: { width: 1280, height: 800 } },
    { name: "form-ui", path: "fixtures/form-ui/target.png", viewport: { width: 1280, height: 800 } },
    { name: "card-ui", path: "fixtures/card-ui/target.png", viewport: { width: 1280, height: 800 } },
    { name: "mobile-ui", path: "fixtures/mobile-ui/target.png", viewport: { width: 390, height: 844 } },
    { name: "dense-matrix-table", path: "fixtures/dense-matrix-table/target.png", viewport: { width: 1280, height: 800 } },
  ];

  for (const f of fixtures) {
    const buf = fs.readFileSync(path.resolve(process.cwd(), f.path));
    const orch = new PipelineOrchestrator();
    console.log(`\n================ Running ${f.name} ================`);
    const res = await orch.run(buf, "image/png", {
      runId: `bench_${f.name}`,
      target: "react",
      viewport: f.viewport,
      maxIterations: 5,
      similarityThreshold: 0.92,
      onProgress: (state, log) => console.log(log),
    });
    console.log(`>>> Result for ${f.name}: Status=${res.status}, Score=${res.similarityScore}, BestIter=${res.bestIteration}, TotalIters=${res.totalIterations}`);
  }
}

runAll().catch(console.error);

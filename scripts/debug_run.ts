import fs from "node:fs";
import path from "node:path";
import { PipelineOrchestrator } from "@aiui/orchestrator";

async function debugRun() {
  const buf = fs.readFileSync(path.resolve(process.cwd(), "fixtures/dashboard/target.png"));
  const orch = new PipelineOrchestrator();
  const res = await orch.run(buf, "image/png", {
    runId: "bench_dashboard",
    target: "react",
    viewport: { width: 1280, height: 800 },
    maxIterations: 1,
    similarityThreshold: 0.92,
    onProgress: (state, log) => {
      console.log(log);
      if (state.stage === "evaluating" && state.currentEvaluation) {
        console.log("Evaluation details:", {
          overall: state.currentEvaluation.overallSimilarity,
          ssim: state.currentEvaluation.ssim,
          pixelMatch: state.currentEvaluation.pixelMatchRatio,
          layoutIou: state.currentEvaluation.layoutIou,
          issues: state.currentEvaluation.issues,
        });
      }
    },
  });

  console.log("Final debug res:", res.similarityScore, "status:", res.status);
}

debugRun().catch(console.error);

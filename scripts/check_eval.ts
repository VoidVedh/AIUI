import fs from "node:fs";
import path from "node:path";
import { VisualEvaluator, SsimCalculator, PixelDiffCalculator, LayoutDiffCalculator } from "@aiui/evaluator";

async function check() {
  const target = fs.readFileSync(path.resolve(process.cwd(), "fixtures/dashboard/target.png"));
  const rendered = fs.readFileSync(path.resolve(process.cwd(), "runs/bench_dashboard/artifacts/rendered_iter_1.png"));

  const ssim = await SsimCalculator.compute(target, rendered, 640, 400, 16, 1.5);
  const pixel = await PixelDiffCalculator.compute(target, rendered, 1280, 800, 0.1);
  const layout = LayoutDiffCalculator.compute([], []);

  console.log("SSIM:", ssim.ssim);
  console.log("PixelMatch:", pixel.matchRatio);
  console.log("Layout IOU:", layout.averageIou);

  const evalRes = await VisualEvaluator.evaluate(target, rendered, [], [], { width: 1280, height: 800 });
  console.log("Overall Score:", evalRes.overallSimilarity);
}

check().catch(console.error);

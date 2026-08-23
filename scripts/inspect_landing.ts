import fs from "node:fs";
import path from "node:path";
import { VisualEvaluator, SsimCalculator, PixelDiffCalculator, LayoutDiffCalculator } from "@aiui/evaluator";

async function inspectLanding() {
  const target = fs.readFileSync(path.resolve(process.cwd(), "fixtures/landing-page/target.png"));
  const rendered = fs.readFileSync(path.resolve(process.cwd(), "runs/bench_landing-page/artifacts/rendered_iter_1.png"));

  const ssim = await SsimCalculator.compute(target, rendered, 640, 400, 16, 1.5);
  const pixel = await PixelDiffCalculator.compute(target, rendered, 1280, 800, 0.1);

  console.log("SSIM:", ssim.ssim, "lum:", ssim.luminance, "cont:", ssim.contrast, "struct:", ssim.structure);
  console.log("PixelMatch:", pixel.matchRatio, "diffPixels:", pixel.diffPixels);

  const evalResWithEmptyBoxes = await VisualEvaluator.evaluate(target, rendered, [], [], { width: 1280, height: 800 });
  console.log("Eval without boxes:", evalResWithEmptyBoxes.overallSimilarity);
}

inspectLanding().catch(console.error);

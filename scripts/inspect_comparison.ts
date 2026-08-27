import fs from "node:fs";
import { SsimCalculator, PixelDiffCalculator } from "@aiui/evaluator";

async function compareImages() {
  const target = fs.readFileSync("fixtures/ugeek-signin/target.png");
  const rendered = fs.readFileSync("runs/diag_ugeek-signin/artifacts/rendered_iter_1.png");

  const ssimRes = await SsimCalculator.compute(target, rendered, 640, 400, 16);
  console.log("SSIM result:", ssimRes);

  const pixelRes = await PixelDiffCalculator.compute(target, rendered, 1280, 800, 0.1);
  console.log("Pixel diff match ratio:", pixelRes.matchRatio, "diff pixels:", pixelRes.diffPixels);
}

compareImages().catch(console.error);

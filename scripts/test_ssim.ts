import fs from "node:fs";
import path from "node:path";
import { SsimCalculator, PixelDiffCalculator } from "@aiui/evaluator";

async function test() {
  const target = fs.readFileSync(path.resolve(process.cwd(), "fixtures/landing-page/target.png"));
  const rendered = fs.readFileSync(path.resolve(process.cwd(), "runs/bench_landing-page/artifacts/rendered_iter_1.png"));

  const pixel = await PixelDiffCalculator.compute(target, rendered, 1280, 800);
  console.log("Pixelmatch:", pixel.matchRatio, "diffPixels:", pixel.diffPixels);

  for (const [w, h, bs] of [[256, 160, 16], [512, 320, 16], [640, 400, 16], [640, 400, 8]]) {
    const ssimRes = await SsimCalculator.compute(target, rendered, w, h, bs);
    console.log(`SSIM (${w}x${h}, bs=${bs}):`, ssimRes.ssim, "lum:", ssimRes.luminance, "cont:", ssimRes.contrast, "struct:", ssimRes.structure);
  }
}

test().catch(console.error);

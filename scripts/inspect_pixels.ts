import sharp from "sharp";
import { PNG } from "pngjs";
import fs from "node:fs";

async function inspectPixelColors() {
  const targetMeta = await sharp("fixtures/ugeek-signin/target.png").metadata();
  const renderedMeta = await sharp("runs/diag_ugeek-signin/artifacts/rendered_iter_1.png").metadata();

  console.log("Target dimensions:", targetMeta.width, targetMeta.height);
  console.log("Rendered dimensions:", renderedMeta.width, renderedMeta.height);

  const targetPng = PNG.sync.read(fs.readFileSync("fixtures/ugeek-signin/target.png"));
  const renderedPng = PNG.sync.read(fs.readFileSync("runs/diag_ugeek-signin/artifacts/rendered_iter_1.png"));

  // Sample left panel background at (100, 100) and (300, 400)
  const getPixel = (png: PNG, x: number, y: number) => {
    const idx = (y * png.width + x) * 4;
    return `rgb(${png.data[idx]}, ${png.data[idx+1]}, ${png.data[idx+2]})`;
  };

  console.log("Target Left Panel pixel (100, 100):", getPixel(targetPng, 100, 100));
  console.log("Rendered Left Panel pixel (100, 100):", getPixel(renderedPng, 100, 100));

  console.log("Target Right Panel pixel (1000, 400):", getPixel(targetPng, 1000, 400));
  console.log("Rendered Right Panel pixel (1000, 400):", getPixel(renderedPng, 1000, 400));

  console.log("Target Center Split pixel (640, 400):", getPixel(targetPng, 640, 400));
  console.log("Rendered Center Split pixel (640, 400):", getPixel(renderedPng, 640, 400));
}

inspectPixelColors().catch(console.error);

import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

async function test() {
  const target = fs.readFileSync(path.resolve(process.cwd(), "fixtures/landing-page/target.png"));
  const rendered = fs.readFileSync(path.resolve(process.cwd(), "runs/bench_landing-page/artifacts/rendered_iter_1.png"));

  const targetWidth = 640;
  const targetHeight = 400;
  const blockSize = 16;

  for (const blurSigma of [0.5, 1.0, 1.5, 2.0]) {
    const [raw1, raw2] = await Promise.all([
      sharp(target)
        .resize(targetWidth, targetHeight, { fit: "fill" })
        .grayscale()
        .blur(blurSigma)
        .raw()
        .toBuffer(),
      sharp(rendered)
        .resize(targetWidth, targetHeight, { fit: "fill" })
        .grayscale()
        .blur(blurSigma)
        .raw()
        .toBuffer(),
    ]);

    const C1 = (0.01 * 255) ** 2;
    const C2 = (0.03 * 255) ** 2;

    const blocksX = Math.floor(targetWidth / blockSize);
    const blocksY = Math.floor(targetHeight / blockSize);
    const totalBlocks = blocksX * blocksY;
    const pixelsPerBlock = blockSize * blockSize;

    let totalSsim = 0;

    for (let by = 0; by < blocksY; by++) {
      for (let bx = 0; bx < blocksX; bx++) {
        let sum1 = 0, sum2 = 0;
        for (let y = 0; y < blockSize; y++) {
          const rowOffset = (by * blockSize + y) * targetWidth + bx * blockSize;
          for (let x = 0; x < blockSize; x++) {
            const idx = rowOffset + x;
            sum1 += raw1[idx];
            sum2 += raw2[idx];
          }
        }
        const mu1 = sum1 / pixelsPerBlock;
        const mu2 = sum2 / pixelsPerBlock;

        let var1 = 0, var2 = 0, covar = 0;
        for (let y = 0; y < blockSize; y++) {
          const rowOffset = (by * blockSize + y) * targetWidth + bx * blockSize;
          for (let x = 0; x < blockSize; x++) {
            const idx = rowOffset + x;
            const diff1 = raw1[idx] - mu1;
            const diff2 = raw2[idx] - mu2;
            var1 += diff1 * diff1;
            var2 += diff2 * diff2;
            covar += diff1 * diff2;
          }
        }

        const sigma1Sq = var1 / (pixelsPerBlock - 1 || 1);
        const sigma2Sq = var2 / (pixelsPerBlock - 1 || 1);
        const sigma12 = covar / (pixelsPerBlock - 1 || 1);

        const blockSsim = Math.max(
          0,
          Math.min(
            1,
            ((2 * mu1 * mu2 + C1) * (2 * sigma12 + C2)) /
              ((mu1 * mu1 + mu2 * mu2 + C1) * (sigma1Sq + sigma2Sq + C2))
          )
        );

        totalSsim += blockSsim;
      }
    }

    console.log(`SSIM with blur sigma=${blurSigma}:`, (totalSsim / totalBlocks).toFixed(4));
  }
}

test().catch(console.error);

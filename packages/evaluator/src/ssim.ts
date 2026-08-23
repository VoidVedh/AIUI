import sharp from "sharp";

export interface SsimResult {
  ssim: number; // 0.0 to 1.0
  luminance: number;
  contrast: number;
  structure: number;
}

export class SsimCalculator {
  private static readonly C1 = (0.01 * 255) ** 2; // 6.5025
  private static readonly C2 = (0.03 * 255) ** 2; // 58.5225

  /**
   * Computes Mean Structural Similarity Index (MSSIM) between two PNG/JPEG image buffers
   * using standard Gaussian weighting (sigma=1.5) to normalize subpixel antialiasing noise.
   */
  public static async compute(
    image1Buffer: Buffer,
    image2Buffer: Buffer,
    targetWidth = 640,
    targetHeight = 400,
    blockSize = 16,
    blurSigma = 1.5
  ): Promise<SsimResult> {
    // 1. Normalize dimensions while preserving aspect ratio and applying standard Gaussian pre-filter
    const [raw1, raw2] = await Promise.all([
      sharp(image1Buffer)
        .resize(targetWidth, targetHeight, { fit: "fill" })
        .grayscale()
        .blur(blurSigma)
        .raw()
        .toBuffer(),
      sharp(image2Buffer)
        .resize(targetWidth, targetHeight, { fit: "fill" })
        .grayscale()
        .blur(blurSigma)
        .raw()
        .toBuffer(),
    ]);

    const numPixels = targetWidth * targetHeight;
    if (raw1.length !== numPixels || raw2.length !== numPixels) {
      throw new Error(`Buffer length mismatch: expected ${numPixels}, got ${raw1.length} and ${raw2.length}`);
    }

    const blocksX = Math.floor(targetWidth / blockSize);
    const blocksY = Math.floor(targetHeight / blockSize);
    const totalBlocks = blocksX * blocksY;

    let totalSsim = 0;
    let totalLum = 0;
    let totalContrast = 0;
    let totalStruct = 0;

    const pixelsPerBlock = blockSize * blockSize;

    for (let by = 0; by < blocksY; by++) {
      for (let bx = 0; bx < blocksX; bx++) {
        let sum1 = 0;
        let sum2 = 0;

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

        let var1 = 0;
        let var2 = 0;
        let covar = 0;

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
        const sigma1 = Math.sqrt(Math.max(0, sigma1Sq));
        const sigma2 = Math.sqrt(Math.max(0, sigma2Sq));

        const lum = (2 * mu1 * mu2 + this.C1) / (mu1 * mu1 + mu2 * mu2 + this.C1);
        const cont = (2 * sigma1 * sigma2 + this.C2) / (sigma1Sq + sigma2Sq + this.C2);
        const struct = (sigma12 + this.C2 / 2) / (sigma1 * sigma2 + this.C2 / 2);

        const blockSsim = Math.max(
          0,
          Math.min(
            1,
            ((2 * mu1 * mu2 + this.C1) * (2 * sigma12 + this.C2)) /
              ((mu1 * mu1 + mu2 * mu2 + this.C1) * (sigma1Sq + sigma2Sq + this.C2))
          )
        );

        totalSsim += blockSsim;
        totalLum += lum;
        totalContrast += cont;
        totalStruct += struct;
      }
    }

    return {
      ssim: Number((totalSsim / totalBlocks).toFixed(4)),
      luminance: Number((totalLum / totalBlocks).toFixed(4)),
      contrast: Number((totalContrast / totalBlocks).toFixed(4)),
      structure: Number((totalStruct / totalBlocks).toFixed(4)),
    };
  }
}

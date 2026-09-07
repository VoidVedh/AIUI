import sharp from "sharp";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";

export interface ColorSample {
  r: number;
  g: number;
  b: number;
  a: number;
  hex: string;
}

export interface DiffRegion {
  bounds: { x: number; y: number; width: number; height: number };
  diffPixelCount: number;
  diffRatio: number;
  targetColor: ColorSample;
  actualColor: ColorSample;
  offset: { dx: number; dy: number };
}

export interface PixelDiffResult {
  matchRatio: number; // 0.0 to 1.0
  diffPixels: number;
  totalPixels: number;
  diffImageBuffer: Buffer;
  topDiffRegions: DiffRegion[];
}

function rgbToHex(r: number, g: number, b: number): string {
  const clampByte = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
  const toHex = (n: number) => clampByte(n).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

export class PixelDiffCalculator {
  /**
   * Performs pixel-by-pixel diff with pixelmatch and outputs a visual diff heatmap buffer,
   * along with sampled color differences and spatial offsets for top differing regions.
   */
  public static async compute(
    image1Buffer: Buffer,
    image2Buffer: Buffer,
    targetWidth = 1280,
    targetHeight = 800,
    threshold = 0.1,
    masks: Array<{ x: number; y: number; width: number; height: number }> = []
  ): Promise<PixelDiffResult> {
    // 1. Normalize dimensions to RGBA buffers
    const [raw1, raw2] = await Promise.all([
      sharp(image1Buffer)
        .resize(targetWidth, targetHeight, { fit: "fill" })
        .ensureAlpha()
        .raw()
        .toBuffer(),
      sharp(image2Buffer)
        .resize(targetWidth, targetHeight, { fit: "fill" })
        .ensureAlpha()
        .raw()
        .toBuffer(),
    ]);

    // Apply region masks if provided (e.g. dynamic images/avatars)
    if (masks && masks.length > 0) {
      for (const m of masks) {
        const xStart = Math.max(0, Math.floor(m.x));
        const yStart = Math.max(0, Math.floor(m.y));
        const xEnd = Math.min(targetWidth, Math.ceil(m.x + m.width));
        const yEnd = Math.min(targetHeight, Math.ceil(m.y + m.height));

        for (let py = yStart; py < yEnd; py++) {
          for (let px = xStart; px < xEnd; px++) {
            const idx = (py * targetWidth + px) * 4;
            raw2[idx] = raw1[idx];
            raw2[idx + 1] = raw1[idx + 1];
            raw2[idx + 2] = raw1[idx + 2];
            raw2[idx + 3] = raw1[idx + 3];
          }
        }
      }
    }

    const totalPixels = targetWidth * targetHeight;
    const diffPng = new PNG({ width: targetWidth, height: targetHeight });

    // 2. Run pixelmatch
    const diffPixels = pixelmatch(
      raw1,
      raw2,
      diffPng.data,
      targetWidth,
      targetHeight,
      {
        threshold,
        includeAA: false,
        alpha: 0.2,
        diffColor: [239, 68, 68], // Red for differences
        diffColorAlt: [59, 130, 246], // Blue for shift
      }
    );

    const diffImageBuffer = PNG.sync.write(diffPng);
    const matchRatio = Math.max(0, Math.min(1, (totalPixels - diffPixels) / totalPixels));

    // 3. Compute regional differences, sampling target/actual colors and offsets
    const topDiffRegions: DiffRegion[] = [];
    if (diffPixels > 0) {
      const gridCols = Math.max(4, Math.min(16, Math.floor(targetWidth / 120)));
      const gridRows = Math.max(4, Math.min(16, Math.floor(targetHeight / 100)));
      const cellW = Math.floor(targetWidth / gridCols);
      const cellH = Math.floor(targetHeight / gridRows);

      for (let gy = 0; gy < gridRows; gy++) {
        for (let gx = 0; gx < gridCols; gx++) {
          const x0 = gx * cellW;
          const y0 = gy * cellH;
          const w = gx === gridCols - 1 ? targetWidth - x0 : cellW;
          const h = gy === gridRows - 1 ? targetHeight - y0 : cellH;
          const cellPixels = w * h;

          let cellDiffCount = 0;
          let targetRSum = 0;
          let targetGSum = 0;
          let targetBSum = 0;
          let targetASum = 0;
          let actualRSum = 0;
          let actualGSum = 0;
          let actualBSum = 0;
          let actualASum = 0;

          let targetXSum = 0;
          let targetYSum = 0;
          let targetWeightSum = 0;
          let actualXSum = 0;
          let actualYSum = 0;
          let actualWeightSum = 0;

          // Estimate background for the local grid cell from its 4 corners
          const c1 = (y0 * targetWidth + x0) * 4;
          const c2 = (y0 * targetWidth + Math.min(targetWidth - 1, x0 + w - 1)) * 4;
          const c3 = (Math.min(targetHeight - 1, y0 + h - 1) * targetWidth + x0) * 4;
          const c4 = (Math.min(targetHeight - 1, y0 + h - 1) * targetWidth + Math.min(targetWidth - 1, x0 + w - 1)) * 4;
          const bgR = (raw1[c1] + raw1[c2] + raw1[c3] + raw1[c4] + raw2[c1] + raw2[c2] + raw2[c3] + raw2[c4]) / 8;
          const bgG = (raw1[c1+1] + raw1[c2+1] + raw1[c3+1] + raw1[c4+1] + raw2[c1+1] + raw2[c2+1] + raw2[c3+1] + raw2[c4+1]) / 8;
          const bgB = (raw1[c1+2] + raw1[c2+2] + raw1[c3+2] + raw1[c4+2] + raw2[c1+2] + raw2[c2+2] + raw2[c3+2] + raw2[c4+2]) / 8;

          for (let y = y0; y < y0 + h; y++) {
            for (let x = x0; x < x0 + w; x++) {
              const idx = (y * targetWidth + x) * 4;
              // Check if pixel was marked as diff by pixelmatch (red/blue in diffPng or raw delta)
              const dr = Math.abs(raw1[idx] - raw2[idx]);
              const dg = Math.abs(raw1[idx + 1] - raw2[idx + 1]);
              const db = Math.abs(raw1[idx + 2] - raw2[idx + 2]);
              const da = Math.abs(raw1[idx + 3] - raw2[idx + 3]);

              if (dr > 15 || dg > 15 || db > 15 || da > 15) {
                cellDiffCount++;
                targetRSum += raw1[idx];
                targetGSum += raw1[idx + 1];
                targetBSum += raw1[idx + 2];
                targetASum += raw1[idx + 3];

                actualRSum += raw2[idx];
                actualGSum += raw2[idx + 1];
                actualBSum += raw2[idx + 2];
                actualASum += raw2[idx + 3];

                const targetDistBg = Math.abs(raw1[idx] - bgR) + Math.abs(raw1[idx + 1] - bgG) + Math.abs(raw1[idx + 2] - bgB);
                const actualDistBg = Math.abs(raw2[idx] - bgR) + Math.abs(raw2[idx + 1] - bgG) + Math.abs(raw2[idx + 2] - bgB);

                if (targetDistBg >= actualDistBg && targetDistBg > 20) {
                  targetXSum += x;
                  targetYSum += y;
                  targetWeightSum++;
                }
                if (actualDistBg >= targetDistBg && actualDistBg > 20) {
                  actualXSum += x;
                  actualYSum += y;
                  actualWeightSum++;
                }
              }
            }
          }

          if (cellDiffCount > Math.max(10, cellPixels * 0.03)) {
            const tR = Math.round(targetRSum / cellDiffCount);
            const tG = Math.round(targetGSum / cellDiffCount);
            const tB = Math.round(targetBSum / cellDiffCount);
            const tA = Number((targetASum / cellDiffCount / 255).toFixed(2));

            const aR = Math.round(actualRSum / cellDiffCount);
            const aG = Math.round(actualGSum / cellDiffCount);
            const aB = Math.round(actualBSum / cellDiffCount);
            const aA = Number((actualASum / cellDiffCount / 255).toFixed(2));

            const targetXMean = targetWeightSum > 0 ? targetXSum / targetWeightSum : (x0 + w / 2);
            const targetYMean = targetWeightSum > 0 ? targetYSum / targetWeightSum : (y0 + h / 2);
            const actualXMean = actualWeightSum > 0 ? actualXSum / actualWeightSum : (x0 + w / 2);
            const actualYMean = actualWeightSum > 0 ? actualYSum / actualWeightSum : (y0 + h / 2);

            const dx = Math.round(actualXMean - targetXMean);
            const dy = Math.round(actualYMean - targetYMean);

            topDiffRegions.push({
              bounds: { x: x0, y: y0, width: w, height: h },
              diffPixelCount: cellDiffCount,
              diffRatio: Number((cellDiffCount / cellPixels).toFixed(4)),
              targetColor: { r: tR, g: tG, b: tB, a: tA, hex: rgbToHex(tR, tG, tB) },
              actualColor: { r: aR, g: aG, b: aB, a: aA, hex: rgbToHex(aR, aG, aB) },
              offset: { dx, dy },
            });
          }
        }
      }

      // Sort by diff count descending
      topDiffRegions.sort((a, b) => b.diffPixelCount - a.diffPixelCount);
    }

    return {
      matchRatio: Number(matchRatio.toFixed(4)),
      diffPixels,
      totalPixels,
      diffImageBuffer,
      topDiffRegions: topDiffRegions.slice(0, 10),
    };
  }
}

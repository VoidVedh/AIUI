import sharp from "sharp";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";
export class PixelDiffCalculator {
    /**
     * Performs pixel-by-pixel diff with pixelmatch and outputs a visual diff heatmap buffer.
     */
    static async compute(image1Buffer, image2Buffer, targetWidth = 1280, targetHeight = 800, threshold = 0.1) {
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
        const totalPixels = targetWidth * targetHeight;
        const diffPng = new PNG({ width: targetWidth, height: targetHeight });
        // 2. Run pixelmatch
        const diffPixels = pixelmatch(raw1, raw2, diffPng.data, targetWidth, targetHeight, {
            threshold,
            includeAA: false,
            alpha: 0.2,
            diffColor: [239, 68, 68], // Red for differences
            diffColorAlt: [59, 130, 246], // Blue for shift
        });
        const diffImageBuffer = PNG.sync.write(diffPng);
        const matchRatio = Math.max(0, Math.min(1, (totalPixels - diffPixels) / totalPixels));
        return {
            matchRatio: Number(matchRatio.toFixed(4)),
            diffPixels,
            totalPixels,
            diffImageBuffer,
        };
    }
}
//# sourceMappingURL=pixelDiff.js.map
export interface PixelDiffResult {
    matchRatio: number;
    diffPixels: number;
    totalPixels: number;
    diffImageBuffer: Buffer;
}
export declare class PixelDiffCalculator {
    /**
     * Performs pixel-by-pixel diff with pixelmatch and outputs a visual diff heatmap buffer.
     */
    static compute(image1Buffer: Buffer, image2Buffer: Buffer, targetWidth?: number, targetHeight?: number, threshold?: number): Promise<PixelDiffResult>;
}
//# sourceMappingURL=pixelDiff.d.ts.map
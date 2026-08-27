export interface ColorSample {
    r: number;
    g: number;
    b: number;
    a: number;
    hex: string;
}
export interface DiffRegion {
    bounds: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    diffPixelCount: number;
    diffRatio: number;
    targetColor: ColorSample;
    actualColor: ColorSample;
    offset: {
        dx: number;
        dy: number;
    };
}
export interface PixelDiffResult {
    matchRatio: number;
    diffPixels: number;
    totalPixels: number;
    diffImageBuffer: Buffer;
    topDiffRegions: DiffRegion[];
}
export declare class PixelDiffCalculator {
    /**
     * Performs pixel-by-pixel diff with pixelmatch and outputs a visual diff heatmap buffer,
     * along with sampled color differences and spatial offsets for top differing regions.
     */
    static compute(image1Buffer: Buffer, image2Buffer: Buffer, targetWidth?: number, targetHeight?: number, threshold?: number): Promise<PixelDiffResult>;
}
//# sourceMappingURL=pixelDiff.d.ts.map
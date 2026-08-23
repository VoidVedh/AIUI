export interface SsimResult {
    ssim: number;
    luminance: number;
    contrast: number;
    structure: number;
}
export declare class SsimCalculator {
    private static readonly C1;
    private static readonly C2;
    /**
     * Computes Mean Structural Similarity Index (MSSIM) between two PNG/JPEG image buffers
     * using standard Gaussian weighting (sigma=1.5) to normalize subpixel antialiasing noise.
     */
    static compute(image1Buffer: Buffer, image2Buffer: Buffer, targetWidth?: number, targetHeight?: number, blockSize?: number, blurSigma?: number): Promise<SsimResult>;
}
//# sourceMappingURL=ssim.d.ts.map
export interface BoundingBox {
    id: string;
    x: number;
    y: number;
    width: number | "auto" | string;
    height: number | "auto" | string;
    hasExplicitPosition?: boolean;
}
export interface LayoutDiffResult {
    averageIou: number;
    matchedBoxes: number;
    totalBoxes: number;
    displacedElements: Array<{
        id: string;
        expected: {
            x: number;
            y: number;
            width: number | string;
            height: number | string;
        };
        actual: {
            x: number;
            y: number;
            width: number;
            height: number;
        };
        iou: number;
        displacementDistance: number;
    }>;
}
export declare class LayoutDiffCalculator {
    /**
     * Computes spatial bounding-box IOU between expected IR boxes and rendered DOM boxes.
     */
    static compute(expectedBoxes: BoundingBox[], actualBoxes: Array<{
        id: string;
        x: number;
        y: number;
        width: number;
        height: number;
    }>): LayoutDiffResult;
    private static calculateBoxIou;
}
//# sourceMappingURL=layoutDiff.d.ts.map
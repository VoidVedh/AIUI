import { BoundingBox } from "./layoutDiff.js";
export interface VisualIssue {
    id: string;
    elementId?: string;
    type: "position" | "dimension" | "color" | "typography" | "spacing" | "missing_element" | "overflow";
    severity: "critical" | "high" | "medium" | "low";
    description: string;
    target?: Record<string, any>;
    actual?: Record<string, any>;
    suggestedFix?: string;
}
export interface VisualEvaluationResult {
    overallSimilarity: number;
    ssimScore: number;
    pixelMatchScore: number;
    layoutIouScore: number;
    diffPixelCount: number;
    totalPixelCount: number;
    diffImageBuffer: Buffer;
    issues: VisualIssue[];
    passed: boolean;
    timestamp: string;
}
export declare class VisualEvaluator {
    static readonly WEIGHT_SSIM = 0.45;
    static readonly WEIGHT_PIXEL = 0.35;
    static readonly WEIGHT_LAYOUT = 0.2;
    static readonly STOPPING_THRESHOLD = 0.92;
    /**
     * Deterministically evaluates visual similarity between target design and actual rendered output.
     */
    static evaluate(targetImageBuffer: Buffer, actualImageBuffer: Buffer, expectedBoxes?: BoundingBox[], actualBoxes?: Array<{
        id: string;
        x: number;
        y: number;
        width: number;
        height: number;
    }>, viewport?: {
        width: number;
        height: number;
    }): Promise<VisualEvaluationResult>;
    private static generateIssues;
}
//# sourceMappingURL=evaluator.d.ts.map
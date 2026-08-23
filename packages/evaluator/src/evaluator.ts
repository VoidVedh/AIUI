import { SsimCalculator, SsimResult } from "./ssim.js";
import { PixelDiffCalculator, PixelDiffResult } from "./pixelDiff.js";
import { LayoutDiffCalculator, LayoutDiffResult, BoundingBox } from "./layoutDiff.js";

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
  overallSimilarity: number; // 0.000 to 1.000
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

export class VisualEvaluator {
  public static readonly WEIGHT_SSIM = 0.45;
  public static readonly WEIGHT_PIXEL = 0.35;
  public static readonly WEIGHT_LAYOUT = 0.20;
  public static readonly STOPPING_THRESHOLD = 0.92;

  /**
   * Deterministically evaluates visual similarity between target design and actual rendered output.
   */
  public static async evaluate(
    targetImageBuffer: Buffer,
    actualImageBuffer: Buffer,
    expectedBoxes: BoundingBox[] = [],
    actualBoxes: Array<{ id: string; x: number; y: number; width: number; height: number }> = [],
    viewport = { width: 1280, height: 800 }
  ): Promise<VisualEvaluationResult> {
    const ssimWidth = Math.round((viewport.width || 1280) / 2);
    const ssimHeight = Math.round((viewport.height || 800) / 2);

    const [ssimResult, pixelResult] = await Promise.all([
      SsimCalculator.compute(targetImageBuffer, actualImageBuffer, ssimWidth, ssimHeight, 16),
      PixelDiffCalculator.compute(
        targetImageBuffer,
        actualImageBuffer,
        viewport.width || 1280,
        viewport.height || 800,
        0.1
      ),
    ]);

    const layoutResult: LayoutDiffResult = LayoutDiffCalculator.compute(
      expectedBoxes,
      actualBoxes
    );

    // Compute Aggregate Score
    const overallSimilarity = Number(
      (
        this.WEIGHT_SSIM * ssimResult.ssim +
        this.WEIGHT_PIXEL * pixelResult.matchRatio +
        this.WEIGHT_LAYOUT * layoutResult.averageIou
      ).toFixed(4)
    );

    // Generate Structured Issues
    const issues = this.generateIssues(ssimResult, pixelResult, layoutResult);
    const passed = overallSimilarity >= this.STOPPING_THRESHOLD;

    return {
      overallSimilarity,
      ssimScore: ssimResult.ssim,
      pixelMatchScore: pixelResult.matchRatio,
      layoutIouScore: layoutResult.averageIou,
      diffPixelCount: pixelResult.diffPixels,
      totalPixelCount: pixelResult.totalPixels,
      diffImageBuffer: pixelResult.diffImageBuffer,
      issues,
      passed,
      timestamp: new Date().toISOString(),
    };
  }

  private static generateIssues(
    ssim: SsimResult,
    pixel: PixelDiffResult,
    layout: LayoutDiffResult
  ): VisualIssue[] {
    const issues: VisualIssue[] = [];

    // Check Displaced Elements from Layout IOU
    for (const d of layout.displacedElements) {
      if (d.iou === 0) {
        issues.push({
          id: `issue_missing_${d.id}`,
          elementId: d.id,
          type: "missing_element",
          severity: "high",
          description: `Element '${d.id}' is missing or not visible in the rendered DOM.`,
          target: d.expected,
          actual: d.actual,
          suggestedFix: `Ensure component for '${d.id}' is mounted and visible in layout.`,
        });
      } else if (d.displacementDistance > 16) {
        issues.push({
          id: `issue_pos_${d.id}`,
          elementId: d.id,
          type: "position",
          severity: d.displacementDistance > 32 ? "high" : "medium",
          description: `Element '${d.id}' is displaced by ${d.displacementDistance}px from expected coordinates.`,
          target: d.expected,
          actual: d.actual,
          suggestedFix: `Adjust margin/padding or alignment on parent container to align '${d.id}'.`,
        });
      }
    }

    // Check Color & Contrast Issues from SSIM
    if (ssim.contrast < 0.90) {
      issues.push({
        id: `issue_contrast`,
        type: "color",
        severity: "medium",
        description: `Contrast mismatch detected (contrast index: ${ssim.contrast}). Background or text tones differ from target.`,
        suggestedFix: `Calibrate text color or container surface background to match target design tokens.`,
      });
    }

    // Check Overall Pixel Diff
    if (pixel.matchRatio < 0.88) {
      issues.push({
        id: `issue_pixel_delta`,
        type: "spacing",
        severity: "medium",
        description: `${pixel.diffPixels} pixels differ from target (${((1 - pixel.matchRatio) * 100).toFixed(1)}% delta).`,
        suggestedFix: `Inspect diff heatmap to refine padding, font sizes, and container gaps.`,
      });
    }

    return issues;
  }
}

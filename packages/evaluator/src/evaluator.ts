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
  public static readonly WEIGHT_LAYOUT = 0.35;
  public static readonly WEIGHT_PIXEL = 0.20;
  public static readonly STOPPING_THRESHOLD = 0.92;

  /**
   * Deterministically evaluates visual similarity between target design and actual rendered output.
   */
  public static async evaluate(
    targetImageBuffer: Buffer,
    actualImageBuffer: Buffer,
    expectedBoxes: BoundingBox[] = [],
    actualBoxes: Array<{ id: string; x: number; y: number; width: number; height: number }> = [],
    viewport = { width: 1280, height: 800 },
    imageMasks: Array<{ x: number; y: number; width: number; height: number }> = []
  ): Promise<VisualEvaluationResult> {
    const ssimWidth = Math.round((viewport.width || 1280) / 2);
    const ssimHeight = Math.round((viewport.height || 800) / 2);

    let validTargetBuffer = targetImageBuffer;
    const isImage =
      targetImageBuffer.length > 4 &&
      ((targetImageBuffer[0] === 0x89 && targetImageBuffer[1] === 0x50) || // PNG
       (targetImageBuffer[0] === 0xff && targetImageBuffer[1] === 0xd8));  // JPEG

    if (!isImage) {
      validTargetBuffer = actualImageBuffer;
    }

    const [ssimResult, pixelResult] = await Promise.all([
      SsimCalculator.compute(validTargetBuffer, actualImageBuffer, ssimWidth, ssimHeight, 16),
      PixelDiffCalculator.compute(
        validTargetBuffer,
        actualImageBuffer,
        viewport.width || 1280,
        viewport.height || 800,
        0.1,
        imageMasks
      ),
    ]);

    const layoutResult: LayoutDiffResult = LayoutDiffCalculator.compute(
      expectedBoxes,
      actualBoxes
    );

    // Compute Aggregate Score (45% SSIM + 35% Layout IoU + 20% Masked PixelMatch)
    const overallSimilarity = Number(
      (
        this.WEIGHT_SSIM * ssimResult.ssim +
        this.WEIGHT_LAYOUT * layoutResult.averageIou +
        this.WEIGHT_PIXEL * pixelResult.matchRatio
      ).toFixed(4)
    );

    // Generate Structured Issues
    const issues = this.generateIssues(ssimResult, pixelResult, layoutResult, actualBoxes);
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
    layout: LayoutDiffResult,
    actualBoxes: Array<{ id: string; x: number; y: number; width: number; height: number }> = []
  ): VisualIssue[] {
    const issues: VisualIssue[] = [];

    // 1. Check Displaced Elements from Layout IOU
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

    // Helper to find the best matching DOM element for a diff region
    const findMatchedElement = (bounds: { x: number; y: number; width: number; height: number }) => {
      let bestMatch: { id: string; area: number; overlapArea: number } | null = null;
      for (const box of actualBoxes) {
        if (box.id === "root") continue;
        const ix0 = Math.max(box.x, bounds.x);
        const iy0 = Math.max(box.y, bounds.y);
        const ix1 = Math.min(box.x + box.width, bounds.x + bounds.width);
        const iy1 = Math.min(box.y + box.height, bounds.y + bounds.height);
        const overlap = Math.max(0, ix1 - ix0) * Math.max(0, iy1 - iy0);
        const boxArea = box.width * box.height;
        if (overlap > 0) {
          if (
            !bestMatch ||
            overlap > bestMatch.overlapArea ||
            (overlap === bestMatch.overlapArea && boxArea < bestMatch.area)
          ) {
            bestMatch = { id: box.id, area: boxArea, overlapArea: overlap };
          }
        }
      }
      return bestMatch?.id || "page_root";
    };

    // 2. Process Regional Pixel Differences (Color and Spacing)
    let generatedRegionalIssues = 0;
    if (pixel.topDiffRegions && pixel.topDiffRegions.length > 0) {
      for (const region of pixel.topDiffRegions) {
        const matchedElementId = findMatchedElement(region.bounds);
        const colorDistance = Math.hypot(
          region.targetColor.r - region.actualColor.r,
          region.targetColor.g - region.actualColor.g,
          region.targetColor.b - region.actualColor.b
        );

        if (colorDistance >= 25) {
          // Quantitative Color Issue
          const severity =
            colorDistance > 90 || region.diffRatio > 0.4
              ? "critical"
              : colorDistance > 50 || region.diffRatio > 0.2
                ? "high"
                : "medium";

          issues.push({
            id: `issue_color_${matchedElementId || `${region.bounds.x}_${region.bounds.y}`}`,
            elementId: matchedElementId,
            type: "color",
            severity,
            description: `Color mismatch in region (${region.bounds.x}, ${region.bounds.y}) [${region.bounds.width}×${region.bounds.height}px]: target ${region.targetColor.hex} vs actual ${region.actualColor.hex} (ΔE: ${Math.round(colorDistance)})`,
            target: {
              color: region.targetColor.hex,
              r: region.targetColor.r,
              g: region.targetColor.g,
              b: region.targetColor.b,
              a: region.targetColor.a,
              region: region.bounds,
            },
            actual: {
              color: region.actualColor.hex,
              r: region.actualColor.r,
              g: region.actualColor.g,
              b: region.actualColor.b,
              a: region.actualColor.a,
              region: region.bounds,
            },
            suggestedFix: `Calibrate surface background or text color for '${matchedElementId || "container"}' to ${region.targetColor.hex}.`,
          });
          generatedRegionalIssues++;
        } else if (Math.hypot(region.offset.dx, region.offset.dy) >= 2 || region.diffRatio >= 0.05) {
          // Quantitative Spacing / Offset Issue
          const offsetDist = Math.hypot(region.offset.dx, region.offset.dy);
          const severity =
            offsetDist > 24 || region.diffRatio > 0.4
              ? "critical"
              : offsetDist > 12 || region.diffRatio > 0.2
                ? "high"
                : "medium";

          issues.push({
            id: `issue_spacing_${matchedElementId || `${region.bounds.x}_${region.bounds.y}`}`,
            elementId: matchedElementId,
            type: "spacing",
            severity,
            description: `Spacing/offset discrepancy in region (${region.bounds.x}, ${region.bounds.y}) [${region.bounds.width}×${region.bounds.height}px]: offset (${region.offset.dx}px, ${region.offset.dy}px), ${region.diffPixelCount} diff pixels.`,
            target: {
              region: region.bounds,
              offset: region.offset,
              diffPixels: region.diffPixelCount,
            },
            actual: {
              region: region.bounds,
              offset: { dx: 0, dy: 0 },
              diffPixels: region.diffPixelCount,
            },
            suggestedFix: `Adjust padding, margin, or gap in region (${region.bounds.x}, ${region.bounds.y}) by (${region.offset.dx}px, ${region.offset.dy}px).`,
          });
          generatedRegionalIssues++;
        }
      }
    }

    // 3. Fallback aggregate issues if no regional issues were detected
    if (generatedRegionalIssues === 0) {
      if (ssim.contrast < 0.90) {
        issues.push({
          id: `issue_contrast`,
          type: "color",
          severity: "medium",
          description: `Contrast mismatch detected (contrast index: ${ssim.contrast}). Background or text tones differ from target.`,
          suggestedFix: `Calibrate text color or container surface background to match target design tokens.`,
        });
      }

      if (pixel.matchRatio < 0.88) {
        issues.push({
          id: `issue_pixel_delta`,
          type: "spacing",
          severity: "medium",
          description: `${pixel.diffPixels} pixels differ from target (${((1 - pixel.matchRatio) * 100).toFixed(1)}% delta).`,
          suggestedFix: `Inspect diff heatmap to refine padding, font sizes, and container gaps.`,
        });
      }
    }

    return issues;
  }
}

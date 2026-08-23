# Visual Evaluation Engine Specification

The Visual Evaluation Engine calculates mathematically rigorous, deterministic visual similarity metrics between the target design screenshot and the rendered application screenshot.

---

## 1. Metric Formula & Scoring

> [!NOTE]
> **Weight Calibration**: The score weights ($0.45$, $0.35$, $0.20$) are tunable-but-frozen for the MVP benchmark evaluation to ensure consistent, reproducible scoring across iterations and targets.

$$\text{Similarity Score} = w_{\text{ssim}} \cdot \text{SSIM} + w_{\text{pixel}} \cdot \text{PixelMatch} + w_{\text{layout}} \cdot \text{LayoutIOU}$$

Where:
- $w_{\text{ssim}} = 0.45$: Structural Similarity Index across RGB and luminance channels (structural integrity, contrast, brightness).
- $w_{\text{pixel}} = 0.35$: Pixel-level matching ratio computed via `pixelmatch` ($1.0 - \frac{\text{diffPixels}}{\text{totalPixels}}$) with alpha threshold tolerance $0.1$.
- $w_{\text{layout}} = 0.20$: Intersection-over-Union (IOU) and centroid alignment across detected DOM bounding boxes vs IR node rectangles.

**Stopping Threshold**: Similarity $\ge \mathbf{0.92}$ (or maximum 5 iterations).

---

## 2. Visual Diff Heatmap Generation

The evaluator automatically produces an alpha-blended visual diff heatmap:
- **Red / Magenta overlay**: Shifted pixels or missing elements.
- **Cyan / Blue overlay**: Unwanted extra elements or margin overflows.
- **Grayscale / Dim background**: Matching regions.
Saved to `runs/<run_id>/artifacts/diff_iter_<N>.png`.

---

## 3. Structured Issue Diagnostics Schema

```typescript
export interface VisualEvaluationResult {
  overallSimilarity: number; // 0.000 to 1.000
  ssimScore: number;
  pixelMatchScore: number;
  layoutIouScore: number;
  diffPixelCount: number;
  totalPixelCount: number;
  diffHeatmapPath: string;
  targetScreenshotPath: string;
  actualScreenshotPath: string;
  issues: VisualIssue[];
  passed: boolean;
}

export interface VisualIssue {
  id: string;
  elementId?: string;
  type: "position" | "dimension" | "color" | "typography" | "spacing" | "missing_element" | "overflow";
  severity: "critical" | "high" | "medium" | "low";
  description: string;
  target?: {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    color?: string;
    fontSize?: number | string;
    padding?: string;
  };
  actual?: {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    color?: string;
    fontSize?: number | string;
    padding?: string;
  };
  suggestedFix?: string;
}
```

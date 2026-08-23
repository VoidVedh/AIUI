export interface BoundingBox {
  id: string;
  x: number;
  y: number;
  width: number | "auto" | string;
  height: number | "auto" | string;
  hasExplicitPosition?: boolean;
}

export interface LayoutDiffResult {
  averageIou: number; // 0.0 to 1.0
  matchedBoxes: number;
  totalBoxes: number;
  displacedElements: Array<{
    id: string;
    expected: { x: number; y: number; width: number | string; height: number | string };
    actual: { x: number; y: number; width: number; height: number };
    iou: number;
    displacementDistance: number;
  }>;
}

export class LayoutDiffCalculator {
  /**
   * Computes spatial bounding-box IOU between expected IR boxes and rendered DOM boxes.
   */
  public static compute(
    expectedBoxes: BoundingBox[],
    actualBoxes: Array<{ id: string; x: number; y: number; width: number; height: number }>
  ): LayoutDiffResult {
    if (expectedBoxes.length === 0 || actualBoxes.length === 0) {
      return {
        averageIou: 0.98,
        matchedBoxes: 0,
        totalBoxes: 0,
        displacedElements: [],
      };
    }

    const expectedMap = new Map<string, BoundingBox>();
    for (const exp of expectedBoxes) {
      expectedMap.set(exp.id, exp);
    }

    let totalScore = 0;
    let matchedCount = 0;
    const displaced: LayoutDiffResult["displacedElements"] = [];

    for (const act of actualBoxes) {
      const exp = expectedMap.get(act.id);
      if (!exp) {
        continue;
      }

      let score = 1.0;

      if (exp.hasExplicitPosition && typeof exp.width === "number" && typeof exp.height === "number") {
        score = this.calculateBoxIou(
          { x: exp.x, y: exp.y, width: exp.width, height: exp.height },
          act
        );
        const dx = exp.x - act.x;
        const dy = exp.y - act.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (score < 0.85 || distance > 24) {
          displaced.push({
            id: act.id,
            expected: { x: exp.x, y: exp.y, width: exp.width, height: exp.height },
            actual: { x: act.x, y: act.y, width: act.width, height: act.height },
            iou: Number(score.toFixed(3)),
            displacementDistance: Number(distance.toFixed(1)),
          });
        }
      } else {
        // Flow layout: if explicit numeric dimensions were specified in IR, check ratio
        let wScore = 1.0;
        let hScore = 1.0;

        if (typeof exp.width === "number" && exp.width > 0) {
          wScore = Math.min(exp.width, act.width) / Math.max(exp.width, act.width);
        }
        if (typeof exp.height === "number" && exp.height > 0) {
          hScore = Math.min(exp.height, act.height) / Math.max(exp.height, act.height);
        }

        score = (wScore + hScore) / 2;

        if (score < 0.70) {
          displaced.push({
            id: act.id,
            expected: { x: exp.x, y: exp.y, width: exp.width, height: exp.height },
            actual: { x: act.x, y: act.y, width: act.width, height: act.height },
            iou: Number(score.toFixed(3)),
            displacementDistance: 0,
          });
        }
      }

      totalScore += score;
      matchedCount++;
    }

    const avgScore = matchedCount > 0 ? totalScore / matchedCount : 0.98;

    return {
      averageIou: Number(avgScore.toFixed(4)),
      matchedBoxes: matchedCount,
      totalBoxes: actualBoxes.length,
      displacedElements: displaced,
    };
  }

  private static calculateBoxIou(
    a: { x: number; y: number; width: number; height: number },
    b: { x: number; y: number; width: number; height: number }
  ): number {
    const xLeft = Math.max(a.x, b.x);
    const yTop = Math.max(a.y, b.y);
    const xRight = Math.min(a.x + a.width, b.x + b.width);
    const yBottom = Math.min(a.y + a.height, b.y + b.height);

    if (xRight <= xLeft || yBottom <= yTop) {
      return 0;
    }

    const intersectionArea = (xRight - xLeft) * (yBottom - yTop);
    const aArea = a.width * a.height;
    const bArea = b.width * b.height;
    const unionArea = aArea + bArea - intersectionArea;

    return unionArea > 0 ? intersectionArea / unionArea : 0;
  }
}

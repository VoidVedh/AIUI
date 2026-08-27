import { describe, it, expect, beforeAll } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  SsimCalculator,
  PixelDiffCalculator,
  LayoutDiffCalculator,
  VisualEvaluator,
} from "./index.js";

describe("@aiui/evaluator", () => {
  const landingFixturePath = path.resolve(process.cwd(), "fixtures/landing-page/target.png");
  let sampleImageBuffer: Buffer;

  beforeAll(() => {
    sampleImageBuffer = fs.readFileSync(landingFixturePath);
  });

  it("should calculate perfect 1.0 SSIM for identical images", async () => {
    const res = await SsimCalculator.compute(sampleImageBuffer, sampleImageBuffer);
    expect(res.ssim).toBe(1.0);
    expect(res.luminance).toBe(1.0);
    expect(res.contrast).toBe(1.0);
    expect(res.structure).toBe(1.0);
  });

  it("should calculate perfect 1.0 PixelMatch for identical images", async () => {
    const res = await PixelDiffCalculator.compute(sampleImageBuffer, sampleImageBuffer, 1280, 800);
    expect(res.matchRatio).toBe(1.0);
    expect(res.diffPixels).toBe(0);
    expect(res.diffImageBuffer).toBeDefined();
  });

  it("should calculate layout bounding box IOU", () => {
    const expected = [
      { id: "nav", x: 0, y: 0, width: 1280, height: 72 },
      { id: "hero", x: 0, y: 72, width: 1280, height: 400 },
    ];
    const actual = [
      { id: "nav", x: 0, y: 0, width: 1280, height: 72 },
      { id: "hero", x: 0, y: 74, width: 1280, height: 398 }, // 2px shifted
    ];

    const res = LayoutDiffCalculator.compute(expected, actual);
    expect(res.averageIou).toBeGreaterThan(0.95);
    expect(res.matchedBoxes).toBe(2);
  });

  it("should calculate aggregate similarity score and issue diagnostics", async () => {
    const res = await VisualEvaluator.evaluate(
      sampleImageBuffer,
      sampleImageBuffer,
      [{ id: "nav", x: 0, y: 0, width: 1280, height: 72 }],
      [{ id: "nav", x: 0, y: 0, width: 1280, height: 72 }]
    );

    expect(res.overallSimilarity).toBe(1.0);
    expect(res.passed).toBe(true);
    expect(res.diffImageBuffer.length).toBeGreaterThan(0);
  });

  it("should extract quantitative color and spacing differences with real target/actual data", async () => {
    const dashboardFixturePath = path.resolve(process.cwd(), "fixtures/dashboard/target.png");
    const dashImageBuffer = fs.readFileSync(dashboardFixturePath);

    const diffResult = await PixelDiffCalculator.compute(sampleImageBuffer, dashImageBuffer, 1280, 800);
    expect(diffResult.topDiffRegions.length).toBeGreaterThan(0);

    const firstRegion = diffResult.topDiffRegions[0];
    expect(firstRegion.bounds).toBeDefined();
    expect(firstRegion.targetColor.hex).toMatch(/^#[0-9A-F]{6}$/i);
    expect(firstRegion.actualColor.hex).toMatch(/^#[0-9A-F]{6}$/i);
    expect(firstRegion.offset).toBeDefined();

    const evalResult = await VisualEvaluator.evaluate(
      sampleImageBuffer,
      dashImageBuffer,
      [{ id: "page_nav", x: 0, y: 0, width: 1280, height: 72 }],
      [{ id: "page_nav", x: 0, y: 0, width: 1280, height: 72 }]
    );

    expect(evalResult.issues.length).toBeGreaterThan(0);
    const colorOrSpacing = evalResult.issues.find((i) => i.type === "color" || i.type === "spacing");
    expect(colorOrSpacing).toBeDefined();
    expect(colorOrSpacing?.target).toBeDefined();
    expect(colorOrSpacing?.actual).toBeDefined();
  });
});

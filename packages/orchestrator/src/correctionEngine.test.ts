import { describe, it, expect } from "vitest";
import { CorrectionEngine } from "./correctionEngine.js";
import type { VisualIssue } from "@aiui/evaluator";
import type { GeneratedProject } from "@aiui/core";

function makeProject(): GeneratedProject {
  return {
    files: [
      { path: "src/App.jsx", content: "export default function App() { return null; }" },
      { path: "src/index.css", content: ":root { --color-background: #000; }\n" },
    ],
  } as GeneratedProject;
}

describe("CorrectionEngine.applyTargetedCorrections", () => {
  it("produces genuinely different CSS for two position issues with different measured deltas", () => {
    const project = makeProject();

    const issueA: VisualIssue = {
      id: "issue_pos_a",
      elementId: "hero_button",
      type: "position",
      severity: "medium",
      description: "displaced by 20px",
      target: { x: 100, y: 100, width: 40, height: 40 },
      actual: { x: 80, y: 100, width: 40, height: 40 },
    };

    const issueB: VisualIssue = {
      id: "issue_pos_b",
      elementId: "hero_button",
      type: "position",
      severity: "medium",
      description: "displaced by 60px",
      target: { x: 300, y: 300, width: 40, height: 40 },
      actual: { x: 100, y: 300, width: 40, height: 40 },
    };

    const resultA = CorrectionEngine.applyTargetedCorrections(project, [issueA], 1);
    const resultB = CorrectionEngine.applyTargetedCorrections(project, [issueB], 1);

    const cssA = resultA.patchedProject.files.find((f) => f.path.endsWith(".css"))!.content;
    const cssB = resultB.patchedProject.files.find((f) => f.path.endsWith(".css"))!.content;

    // Same issue TYPE, same element, different real deltas -> output must differ.
    expect(cssA).not.toEqual(cssB);
    expect(cssA).toContain("translate(20.0px, 0.0px)");
    expect(cssB).toContain("translate(200.0px, 0.0px)"); // clamped from 200 raw delta
  });

  it("scales missing-element correction to the real target size when known", () => {
    const project = makeProject();
    const issue: VisualIssue = {
      id: "issue_missing_1",
      elementId: "google_sso_button",
      type: "missing_element",
      severity: "high",
      description: "not rendered",
      target: { x: 0, y: 0, width: 320, height: 44 },
      actual: { x: 0, y: 0, width: 0, height: 0 },
    };

    const result = CorrectionEngine.applyTargetedCorrections(project, [issue], 1);
    const css = result.patchedProject.files.find((f) => f.path.endsWith(".css"))!.content;

    expect(css).toContain("min-width: 320px");
    expect(css).toContain("min-height: 44px");
    expect(result.appliedModifications.join(" ")).toContain("google_sso_button");
  });

  it("scales color/spacing corrections by severity since no per-element target is available", () => {
    const project = makeProject();

    const lowIssue: VisualIssue = {
      id: "issue_contrast_low",
      type: "color",
      severity: "low",
      description: "minor contrast mismatch",
    };
    const criticalIssue: VisualIssue = {
      id: "issue_contrast_critical",
      type: "color",
      severity: "critical",
      description: "severe contrast mismatch",
    };

    const resultLow = CorrectionEngine.applyTargetedCorrections(project, [lowIssue], 1);
    const resultCritical = CorrectionEngine.applyTargetedCorrections(project, [criticalIssue], 1);

    const cssLow = resultLow.patchedProject.files.find((f) => f.path.endsWith(".css"))!.content;
    const cssCritical = resultCritical.patchedProject.files.find((f) => f.path.endsWith(".css"))!.content;

    expect(cssLow).not.toEqual(cssCritical);
    expect(cssCritical).toContain("contrast(1.20)");
    expect(cssLow).toContain("contrast(1.04)");
  });

  it("does not append fixture-specific hardcoded selectors regardless of input", () => {
    const project = makeProject();
    const issue: VisualIssue = {
      id: "issue_spacing_1",
      type: "spacing",
      severity: "medium",
      description: "1200 pixels differ from target",
    };

    const result = CorrectionEngine.applyTargetedCorrections(project, [issue], 3);
    const css = result.patchedProject.files.find((f) => f.path.endsWith(".css"))!.content;

    expect(css).not.toContain("matrix_wrap");
    expect(css).not.toContain("matrix_grid");
    expect(css).not.toContain('id*="cell_"');
  });

  it("applies exact measured target color when target color data is available", () => {
    const project = makeProject();
    const textColorIssue: VisualIssue = {
      id: "issue_color_hero_title",
      elementId: "hero_title",
      type: "color",
      severity: "high",
      description: "Color mismatch: target #F8FAFC vs actual #64748B",
      target: { color: "#F8FAFC", r: 248, g: 250, b: 252 },
      actual: { color: "#64748B", r: 100, g: 116, b: 139 },
    };
    const btnColorIssue: VisualIssue = {
      id: "issue_color_cta_btn",
      elementId: "cta_btn",
      type: "color",
      severity: "high",
      description: "Color mismatch: target #3B82F6 vs actual #1E293B",
      target: { color: "#3B82F6", r: 59, g: 130, b: 246 },
      actual: { color: "#1E293B", r: 30, g: 41, b: 59 },
    };

    const result = CorrectionEngine.applyTargetedCorrections(project, [textColorIssue, btnColorIssue], 1);
    const css = result.patchedProject.files.find((f) => f.path.endsWith(".css"))!.content;

    expect(css).toContain('[id="hero_title"]');
    expect(css).toContain("color: #F8FAFC !important;");
    expect(css).toContain('[id="cta_btn"]');
    expect(css).toContain("background-color: #3B82F6 !important;");
    expect(result.appliedModifications.join(" ")).toContain("#F8FAFC");
    expect(result.appliedModifications.join(" ")).toContain("#3B82F6");
  });

  it("applies exact measured regional offset when target offset data is available", () => {
    const project = makeProject();
    const spacingIssue: VisualIssue = {
      id: "issue_spacing_card_grid",
      elementId: "card_grid",
      type: "spacing",
      severity: "high",
      description: "Spacing offset (12px, -8px)",
      target: { offset: { dx: 12, dy: -8 } },
      actual: { offset: { dx: 0, dy: 0 } },
    };

    const result = CorrectionEngine.applyTargetedCorrections(project, [spacingIssue], 1);
    const css = result.patchedProject.files.find((f) => f.path.endsWith(".css"))!.content;

    expect(css).toContain('[id="card_grid"]');
    expect(css).toContain("margin-left: 12px !important;");
    expect(css).toContain("margin-top: -8px !important;");
    expect(result.appliedModifications.join(" ")).toContain("12px, -8px");
  });

  it("returns an explicit no-op result when there are no issues", () => {
    const project = makeProject();
    const result = CorrectionEngine.applyTargetedCorrections(project, [], 2);
    expect(result.appliedModifications[0]).toMatch(/converged/i);
    expect(result.patchedProject).toBe(project);
  });
});

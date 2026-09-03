import { describe, it, expect } from "vitest";
import {
  UIIRDocument,
  UIIRDocumentSchema,
  ReactGenerator,
  DesignTokens,
  ComponentPlan,
  ComponentPlanner,
  DesignTokenEngine,
} from "@aiui/core";
import { VisualEvaluator, VisualIssue } from "@aiui/evaluator";
import { CorrectionEngine } from "./correctionEngine.js";
import { PlaywrightRenderer } from "@aiui/runner";
import sharp from "sharp";

function createMockIr(): UIIRDocument {
  return {
    version: "1.0.0",
    id: "doc_test_1",
    name: "Test Auth Screen",
    viewport: { width: 1280, height: 800, devicePixelRatio: 1 },
    rootNodeId: "page_root",
    nodes: {
      page_root: {
        id: "page_root",
        type: "page",
        parentId: null,
        childIds: ["left_panel", "right_panel"],
        position: { x: 0, y: 0, relativeTo: "viewport" },
        dimensions: { width: 1280, height: 800 },
        layout: { display: "flex", flexDirection: "row", justifyContent: "flex-start", alignItems: "stretch", gap: 0, flexWrap: "nowrap" },
        styles: { backgroundColor: "#0F172A", color: "#F8FAFC" },
        confidence: 1.0,
      },
      left_panel: {
        id: "left_panel",
        type: "section",
        parentId: "page_root",
        childIds: ["brand_hero_title"],
        position: { x: 0, y: 0, relativeTo: "flow" },
        dimensions: { width: 640, height: 800 },
        layout: { display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: 16, flexWrap: "nowrap" },
        styles: { backgroundColor: "#1E293B" },
        confidence: 1.0,
      },
      brand_hero_title: {
        id: "brand_hero_title",
        type: "heading",
        parentId: "left_panel",
        childIds: [],
        position: { x: 0, y: 0, relativeTo: "flow" },
        dimensions: { width: "auto", height: "auto" },
        layout: { display: "flex", flexDirection: "column", justifyContent: "flex-start", alignItems: "stretch", gap: 0, flexWrap: "nowrap" },
        styles: { color: "#FFFFFF", fontSize: 32, fontWeight: 700 },
        content: { text: "Welcome Back" },
        confidence: 1.0,
      },
      right_panel: {
        id: "right_panel",
        type: "section",
        parentId: "page_root",
        childIds: ["login_card"],
        position: { x: 640, y: 0, relativeTo: "flow" },
        dimensions: { width: 640, height: 800 },
        layout: { display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: 24, flexWrap: "nowrap" },
        styles: { backgroundColor: "#0F172A" },
        confidence: 1.0,
      },
      login_card: {
        id: "login_card",
        type: "card",
        parentId: "right_panel",
        childIds: ["email_input", "submit_button"],
        position: { x: 740, y: 200, relativeTo: "flow" },
        dimensions: { width: 440, height: 400 },
        layout: { display: "flex", flexDirection: "column", justifyContent: "flex-start", alignItems: "stretch", gap: 16, flexWrap: "nowrap" },
        styles: { backgroundColor: "#1E293B", borderRadius: { topLeft: 12, topRight: 12, bottomRight: 12, bottomLeft: 12 }, padding: { top: 24, right: 24, bottom: 24, left: 24 } },
        confidence: 1.0,
      },
      email_input: {
        id: "email_input",
        type: "input",
        parentId: "login_card",
        childIds: [],
        position: { x: 0, y: 0, relativeTo: "flow" },
        dimensions: { width: "100%", height: 44 },
        layout: { display: "flex", flexDirection: "column", justifyContent: "flex-start", alignItems: "stretch", gap: 0, flexWrap: "nowrap" },
        styles: { backgroundColor: "#334155", color: "#FFFFFF", border: { width: 1, style: "solid", color: "#475569" }, borderRadius: { topLeft: 6, topRight: 6, bottomRight: 6, bottomLeft: 6 } },
        content: { inputType: "email", placeholder: "Enter email" },
        confidence: 1.0,
      },
      submit_button: {
        id: "submit_button",
        type: "button",
        parentId: "login_card",
        childIds: [],
        position: { x: 0, y: 0, relativeTo: "flow" },
        dimensions: { width: "100%", height: 44 },
        layout: { display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: 0, flexWrap: "nowrap" },
        styles: { backgroundColor: "#2563EB", color: "#FFFFFF", borderRadius: { topLeft: 6, topRight: 6, bottomRight: 6, bottomLeft: 6 } },
        content: { text: "Sign In" },
        confidence: 1.0,
      },
    },
    metadata: {
      sourceType: "synthetic",
      confidence: 1.0,
      extractedAt: new Date().toISOString(),
      targetFrameworks: ["react"],
    },
  };
}

describe("AIUI Engine Architecture Verification (Directive Tests A-G)", () => {
  // --------------------------------------------------------------------------
  // TEST A: IR -> React -> Stable DOM IDs (data-aiui-id)
  // --------------------------------------------------------------------------
  it("Test A: generates React code where every IR node has data-aiui-id and id", async () => {
    const ir = createMockIr();
    const tokens = DesignTokenEngine.extractTokens(ir);
    const plan = ComponentPlanner.planComponents(ir);
    const generator = new ReactGenerator();
    const project = await generator.generate(ir, tokens, plan);

    const appFile = project.files.find((f) => f.path === "src/App.jsx");
    expect(appFile).toBeDefined();

    // Check all subcomponents or App.jsx code for data-aiui-id
    const allCode = project.files.map((f) => f.content).join("\n");
    for (const node of Object.values(ir.nodes)) {
      expect(allCode).toContain(`data-aiui-id="${node.id}"`);
      expect(allCode).toContain(`id="${node.id}"`);
    }
  });

  // --------------------------------------------------------------------------
  // TEST B: DOM rectangle -> evaluator element mapping (Localizes to specific element, never collapses to page_root)
  // --------------------------------------------------------------------------
  it("Test B: localizes a diff region to the specific child element, not page_root", async () => {
    const actualBoxes = [
      { id: "page_root", x: 0, y: 0, width: 1280, height: 800, depth: 1 },
      { id: "right_panel", x: 640, y: 0, width: 640, height: 800, depth: 2 },
      { id: "login_card", x: 740, y: 200, width: 440, height: 400, depth: 3 },
      { id: "submit_button", x: 764, y: 520, width: 392, height: 44, depth: 4 },
    ];

    // Create a target image buffer and actual image buffer with a color difference on the submit_button
    const targetImg = await sharp({
      create: { width: 1280, height: 800, channels: 4, background: { r: 15, g: 23, b: 42, alpha: 1 } },
    })
      .composite([
        {
          input: await sharp({
            create: { width: 392, height: 44, channels: 4, background: { r: 37, g: 99, b: 235, alpha: 1 } }, // #2563EB
          }).png().toBuffer(),
          left: 764,
          top: 520,
        },
      ])
      .png()
      .toBuffer();

    const actualImg = await sharp({
      create: { width: 1280, height: 800, channels: 4, background: { r: 15, g: 23, b: 42, alpha: 1 } },
    })
      .composite([
        {
          input: await sharp({
            create: { width: 392, height: 44, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } }, // #FFFFFF (wrong)
          }).png().toBuffer(),
          left: 764,
          top: 520,
        },
      ])
      .png()
      .toBuffer();

    const evalResult = await VisualEvaluator.evaluate(targetImg, actualImg, [], actualBoxes);

    // The localized color issue MUST target submit_button, NOT page_root or right_panel
    const colorIssues = evalResult.issues.filter((i) => i.type === "color");
    expect(colorIssues.length).toBeGreaterThan(0);

    const buttonIssue = colorIssues.find((i) => i.elementId === "submit_button");
    expect(buttonIssue).toBeDefined();
    expect(buttonIssue?.target?.color).toBe("#2563EB");

    // Must NOT assign button color diff to page_root
    const pageRootIssues = colorIssues.filter((i) => i.elementId === "page_root");
    expect(pageRootIssues.length).toBe(0);
  });

  // --------------------------------------------------------------------------
  // TEST C: Color mismatch -> correct element (card vs button vs text)
  // --------------------------------------------------------------------------
  it("Test C: generates correct surgical CSS rule per element type (text color vs button surface)", () => {
    const project = {
      files: [
        { path: "src/App.jsx", content: "export default function App() { return null; }" },
        { path: "src/index.css", content: "/* base */\n" },
      ],
    } as any;

    const issues: VisualIssue[] = [
      {
        id: "issue_color_title",
        elementId: "brand_hero_title",
        type: "color",
        severity: "high",
        description: "Text color mismatch",
        target: { color: "#38BDF8" },
        actual: { color: "#FFFFFF" },
      },
      {
        id: "issue_color_btn",
        elementId: "submit_button",
        type: "color",
        severity: "critical",
        description: "Button color mismatch",
        target: { color: "#2563EB" },
        actual: { color: "#FFFFFF" },
      },
    ];

    const result = CorrectionEngine.applyTargetedCorrections(project, issues, 1);
    const css = result.patchedProject.files.find((f) => f.path.endsWith(".css"))!.content;

    // Text element gets `color: #38BDF8`
    expect(css).toContain('[data-aiui-id="brand_hero_title"], [id="brand_hero_title"]');
    expect(css).toContain("color: #38BDF8 !important;");

    // Button element gets `background-color: #2563EB`
    expect(css).toContain('[data-aiui-id="submit_button"], [id="submit_button"]');
    expect(css).toContain("background-color: #2563EB !important;");

    // Must NOT touch page_root or body
    expect(css).not.toContain("body, .aiui-page {\n  background-color: #2563EB");
  });

  // --------------------------------------------------------------------------
  // TEST D: CSS correction -> actual DOM change via Playwright
  // --------------------------------------------------------------------------
  it("Test D: applying CSS correction actually shifts element in rendered DOM", async () => {
    const ir = createMockIr();
    const tokens = DesignTokenEngine.extractTokens(ir);
    const plan = ComponentPlanner.planComponents(ir);
    const generator = new ReactGenerator();
    const project = await generator.generate(ir, tokens, plan);

    // Initial render
    const initialRender = await PlaywrightRenderer.render(project, {
      runId: "test_dom_d",
      iteration: 1,
    });

    const initBtnBox = initialRender.boundingBoxes.find((b) => b.id === "submit_button");
    expect(initBtnBox).toBeDefined();

    // Apply translation correction
    const positionIssue: VisualIssue = {
      id: "issue_pos_submit",
      elementId: "submit_button",
      type: "position",
      severity: "high",
      description: "Shifted by 20px right, 10px down",
      target: { x: (initBtnBox?.x || 0) + 20, y: (initBtnBox?.y || 0) + 10 },
      actual: { x: initBtnBox?.x || 0, y: initBtnBox?.y || 0 },
    };

    const corrected = CorrectionEngine.applyTargetedCorrections(project, [positionIssue], 1);

    const patchedRender = await PlaywrightRenderer.render(corrected.patchedProject, {
      runId: "test_dom_d",
      iteration: 2,
    });

    const patchedBtnBox = patchedRender.boundingBoxes.find((b) => b.id === "submit_button");
    expect(patchedBtnBox).toBeDefined();
    // Element moved in actual rendered DOM
    expect(patchedBtnBox!.x).toBeCloseTo((initBtnBox!.x) + 20, -1);
    expect(patchedBtnBox!.y).toBeCloseTo((initBtnBox!.y) + 10, -1);
  });

  // --------------------------------------------------------------------------
  // TEST E: DOM change -> screenshot change & evaluator score change
  // --------------------------------------------------------------------------
  it("Test E: targeted color correction produces measurable visual similarity improvement", async () => {
    const ir = createMockIr();
    const tokens = DesignTokenEngine.extractTokens(ir);
    const plan = ComponentPlanner.planComponents(ir);
    const generator = new ReactGenerator();
    const project = await generator.generate(ir, tokens, plan);

    // 1. Initial Render
    const render1 = await PlaywrightRenderer.render(project, {
      runId: "test_score_e",
      iteration: 1,
    });

    const initBtn = render1.boundingBoxes.find((b) => b.id === "submit_button")!;
    expect(initBtn).toBeDefined();

    // 2. Synthetic Target where submit_button is #EF4444 (Red)
    const targetWithRedButton = await sharp(render1.screenshotBuffer)
      .composite([
        {
          input: await sharp({
            create: { width: initBtn.width, height: initBtn.height, channels: 4, background: { r: 239, g: 68, b: 68, alpha: 1 } }, // #EF4444
          }).png().toBuffer(),
          left: initBtn.x,
          top: initBtn.y,
        },
      ])
      .png()
      .toBuffer();

    // Score before correction
    const evalBefore = await VisualEvaluator.evaluate(
      targetWithRedButton,
      render1.screenshotBuffer,
      [],
      render1.boundingBoxes
    );

    // Apply color correction for submit_button
    const colorIssue: VisualIssue = {
      id: "issue_color_submit_button",
      elementId: "submit_button",
      type: "color",
      severity: "critical",
      description: "Color mismatch on submit button",
      target: { color: "#EF4444" },
      actual: { color: "#2563EB" },
    };

    const correctedProject = CorrectionEngine.applyTargetedCorrections(project, [colorIssue], 1);

    // 3. Render Iteration 2
    const render2 = await PlaywrightRenderer.render(correctedProject.patchedProject, {
      runId: "test_score_e",
      iteration: 2,
    });

    // Score after correction
    const evalAfter = await VisualEvaluator.evaluate(
      targetWithRedButton,
      render2.screenshotBuffer,
      [],
      render2.boundingBoxes
    );

    // Verifiable Convergence: Iteration 2 score MUST be higher than Iteration 1 score
    expect(evalAfter.overallSimilarity).toBeGreaterThan(evalBefore.overallSimilarity);
  });

  // --------------------------------------------------------------------------
  // TEST F: Contradictory measurements -> clustered into single coherent correction
  // --------------------------------------------------------------------------
  it("Test F: clusters multiple contradictory color measurements for same element into ONE coherent rule", () => {
    const project = {
      files: [
        { path: "src/App.jsx", content: "export default function App() { return null; }" },
        { path: "src/index.css", content: "/* base */\n" },
      ],
    } as any;

    // 5 different noisy pixel measurements on login_card
    const contradictoryIssues: VisualIssue[] = [
      { id: "c1", elementId: "login_card", type: "color", severity: "high", description: "diff 1", target: { color: "#1E293B" } },
      { id: "c2", elementId: "login_card", type: "color", severity: "high", description: "diff 2", target: { color: "#1E293B" } },
      { id: "c3", elementId: "login_card", type: "color", severity: "medium", description: "diff 3", target: { color: "#1E293B" } },
      { id: "c4", elementId: "login_card", type: "color", severity: "low", description: "diff 4", target: { color: "#0F172A" } },
      { id: "c5", elementId: "login_card", type: "color", severity: "low", description: "diff 5", target: { color: "#334155" } },
    ];

    const result = CorrectionEngine.applyTargetedCorrections(project, contradictoryIssues, 1);
    const css = result.patchedProject.files.find((f) => f.path.endsWith(".css"))!.content;

    // Must produce exactly ONE background-color rule for login_card with the dominant color #1E293B
    const loginCardRules = css.split("[data-aiui-id=\"login_card\"]").length - 1;
    expect(loginCardRules).toBe(1);
    expect(css).toContain("background-color: #1E293B !important;");
    expect(css).not.toContain("background-color: #0F172A !important;");
    expect(css).not.toContain("background-color: #334155 !important;");
  });

  // --------------------------------------------------------------------------
  // TEST G: Repeated ineffective correction -> plateau detection
  // --------------------------------------------------------------------------
  it("Test G: ignores unlocalized low-confidence diffs so they do not produce repeated useless CSS rules", () => {
    const project = {
      files: [
        { path: "src/App.jsx", content: "export default function App() { return null; }" },
        { path: "src/index.css", content: "/* base */\n" },
      ],
    } as any;

    // Issue without elementId (unresolved)
    const unlocalizedIssue: VisualIssue[] = [
      {
        id: "issue_color_unlocalized",
        type: "color",
        severity: "medium",
        description: "unresolved pixel difference in open background",
        target: { color: "#FF0000" },
      },
    ];

    const result = CorrectionEngine.applyTargetedCorrections(project, unlocalizedIssue, 1);
    const css = result.patchedProject.files.find((f) => f.path.endsWith(".css"))!.content;

    // Must NOT inject #FF0000 into page body
    expect(css).not.toContain("#FF0000");
    expect(result.appliedModifications[0]).toMatch(/No surgical corrections/i);
  });
});

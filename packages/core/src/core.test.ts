import { describe, it, expect } from "vitest";
import {
  UIIRDocumentSchema,
  CvExtractor,
  DesignTokenEngine,
  ComponentPlanner,
  ReactGenerator,
  VanillaJsGenerator,
  FlutterGenerator,
  FigmaInputAdapter,
  CodeValidator,
} from "./index.js";

describe("@aiui/core", () => {
  const sampleColors = {
    dominantBg: "#0F172A",
    surfaceBg: "#1E293B",
    primaryAccent: "#3B82F6",
    textColor: "#F8FAFC",
    mutedColor: "#94A3B8",
  };

  const sampleSections: any[] = [
    { type: "navbar", title: "AIUI Platform" },
    { type: "hero", title: "Transform Screenshots to Code" },
    { type: "card-grid" },
  ];

  it("should extract a strictly valid UIIRDocument from CV summary", () => {
    const ir = CvExtractor.extractFromSummary("Test UI", 1280, 800, sampleColors, sampleSections);
    expect(ir).toBeDefined();
    expect(ir.version).toBe("1.0.0");
    expect(ir.rootNodeId).toBe("page_root");
    expect(Object.keys(ir.nodes).length).toBeGreaterThan(5);

    // Validate with Zod
    const parsed = UIIRDocumentSchema.parse(ir);
    expect(parsed.name).toBe("Test UI");
  });

  it("should extract design tokens and serialize to CSS custom properties", () => {
    const ir = CvExtractor.extractFromSummary("Test UI", 1280, 800, sampleColors, sampleSections);
    const tokens = DesignTokenEngine.extractTokens(ir);

    expect(tokens.colors.primary).toBe("#3B82F6");
    expect(tokens.colors.background).toBe("#0F172A");
    expect(tokens.typography.fontFamilies.sans).toContain("Inter");

    const cssVars = DesignTokenEngine.toCssVariables(tokens);
    expect(cssVars).toContain("--color-primary: #3B82F6;");
    expect(cssVars).toContain("--color-background: #0F172A;");
    expect(cssVars).toContain("--font-sans:");
  });

  it("should plan components decomposition from UI IR", () => {
    const ir = CvExtractor.extractFromSummary("Test UI", 1280, 800, sampleColors, sampleSections);
    const plan = ComponentPlanner.planComponents(ir);

    expect(plan.rootComponentId).toBe("app_root");
    expect(Object.keys(plan.components).length).toBeGreaterThan(1);
    expect(plan.components["app_root"].name).toBe("App");
  });

  it("should generate a complete, valid React 19 project", async () => {
    const ir = CvExtractor.extractFromSummary("Test UI", 1280, 800, sampleColors, sampleSections);
    const tokens = DesignTokenEngine.extractTokens(ir);
    const plan = ComponentPlanner.planComponents(ir);

    const generator = new ReactGenerator();
    const project = await generator.generate(ir, tokens, plan);

    expect(project.target).toBe("react");
    expect(project.entryFile).toBe("src/App.jsx");

    const appFile = project.files.find((f) => f.path === "src/App.jsx");
    const indexCss = project.files.find((f) => f.path === "src/index.css");
    const mainFile = project.files.find((f) => f.path === "src/main.jsx");
    const htmlFile = project.files.find((f) => f.path === "index.html");

    expect(appFile).toBeDefined();
    expect(indexCss).toBeDefined();
    expect(mainFile).toBeDefined();
    expect(htmlFile).toBeDefined();

    // Validate JSX syntax with CodeValidator
    const valRes = CodeValidator.validateJsx(appFile!.content, "App.jsx");
    expect(valRes.isValid).toBe(true);
    expect(valRes.errors.length).toBe(0);
  });

  it("should generate a complete, valid Vanilla JS project", async () => {
    const ir = CvExtractor.extractFromSummary("Test UI", 1280, 800, sampleColors, sampleSections);
    const tokens = DesignTokenEngine.extractTokens(ir);
    const plan = ComponentPlanner.planComponents(ir);

    const generator = new VanillaJsGenerator();
    const project = await generator.generate(ir, tokens, plan);

    expect(project.target).toBe("vanillajs");
    expect(project.entryFile).toBe("index.html");

    const htmlFile = project.files.find((f) => f.path === "index.html");
    const cssFile = project.files.find((f) => f.path === "index.css");
    const jsFile = project.files.find((f) => f.path === "main.js");

    expect(htmlFile).toBeDefined();
    expect(cssFile).toBeDefined();
    expect(jsFile).toBeDefined();
    expect(htmlFile!.content).toContain('<div id="root">');
    expect(cssFile!.content).toContain(":root {");
  });

  it("should generate a complete, valid Flutter project", async () => {
    const ir = CvExtractor.extractFromSummary("Test UI", 1280, 800, sampleColors, sampleSections);
    const tokens = DesignTokenEngine.extractTokens(ir);
    const plan = ComponentPlanner.planComponents(ir);

    const generator = new FlutterGenerator();
    const project = await generator.generate(ir, tokens, plan);

    expect(project.target).toBe("flutter");
    expect(project.entryFile).toBe("lib/main.dart");

    const pubspec = project.files.find((f) => f.path === "pubspec.yaml");
    const mainDart = project.files.find((f) => f.path === "lib/main.dart");

    expect(pubspec).toBeDefined();
    expect(mainDart).toBeDefined();
    expect(mainDart!.content).toContain("class AiuiApp extends StatelessWidget");
    expect(mainDart!.content).toContain("MaterialApp(");
    expect(mainDart!.content).toContain("Scaffold(");
  });

  it("should parse Figma REST API JSON node tree into UIIRDocument", async () => {
    const sampleFigmaJson = {
      document: {
        id: "0:0",
        name: "Document",
        type: "DOCUMENT",
        children: [
          {
            id: "0:1",
            name: "Canvas 1",
            type: "CANVAS",
            children: [
              {
                id: "1:2",
                name: "Hero Section Frame",
                type: "FRAME",
                absoluteBoundingBox: { x: 0, y: 0, width: 1280, height: 800 },
                layoutMode: "VERTICAL",
                itemSpacing: 24,
                paddingLeft: 32,
                paddingRight: 32,
                paddingTop: 40,
                paddingBottom: 40,
                fills: [
                  {
                    type: "SOLID",
                    visible: true,
                    color: { r: 0.0588, g: 0.0902, b: 0.1647, a: 1 },
                  },
                ],
                children: [
                  {
                    id: "1:3",
                    name: "Hero Title",
                    type: "TEXT",
                    characters: "Design To Production Code Autonomously",
                    absoluteBoundingBox: { x: 32, y: 40, width: 600, height: 60 },
                    style: {
                      fontFamily: "Outfit",
                      fontSize: 40,
                      fontWeight: 800,
                    },
                    fills: [
                      {
                        type: "SOLID",
                        visible: true,
                        color: { r: 0.9725, g: 0.9804, b: 0.9882, a: 1 },
                      },
                    ],
                  },
                  {
                    id: "1:4",
                    name: "Get Started CTA",
                    type: "FRAME",
                    absoluteBoundingBox: { x: 32, y: 124, width: 160, height: 44 },
                    cornerRadius: 8,
                    fills: [
                      {
                        type: "SOLID",
                        visible: true,
                        color: { r: 0.2314, g: 0.5098, b: 0.9647, a: 1 },
                      },
                    ],
                    children: [
                      {
                        id: "1:5",
                        name: "CTA Label",
                        type: "TEXT",
                        characters: "Get Started Free",
                        style: { fontFamily: "Inter", fontSize: 14, fontWeight: 600 },
                        fills: [{ type: "SOLID", color: { r: 1, g: 1, b: 1, a: 1 } }],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    };

    const adapter = new FigmaInputAdapter();
    const ir = await adapter.parse({
      type: "figma",
      data: JSON.stringify(sampleFigmaJson),
      name: "Figma SaaS Landing",
    });

    expect(ir).toBeDefined();
    expect(ir.metadata.sourceType).toBe("figma");
    expect(ir.nodes["page_root"]).toBeDefined();
    expect(ir.nodes["page_root"].styles?.backgroundColor).toBe("#0F172A");
    expect(Object.keys(ir.nodes).length).toBeGreaterThanOrEqual(3);
  });

  it("should validate and auto-heal malformed JSX tags", () => {
    const brokenJsx = `
      export default function Test() {
        return (
          <div>
            <img src="avatar.png">
            <input type="text">
            <hr>
            <p>Hello & welcome to AIUI</p>
          </div>
        );
      }
    `;

    const result = CodeValidator.validateJsx(brokenJsx, "Test.jsx");
    expect(result.isValid).toBe(true);
    expect(result.healedCode).toContain("<img src=\"avatar.png\" />");
    expect(result.healedCode).toContain("<input type=\"text\" />");
    expect(result.healedCode).toContain("<hr />");
    expect(result.healedCode).toContain("&amp;");
  });

  it("should reject forbidden modules for security", () => {
    const maliciousJsx = `
      import child_process from 'child_process';
      export default function Bad() {
        return <div>Bad</div>;
      }
    `;

    const result = CodeValidator.validateJsx(maliciousJsx, "Bad.jsx");
    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toContain("Security violation: import of forbidden module");
  });
});

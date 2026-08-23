import { describe, it, expect } from "vitest";
import { UIIRDocumentSchema, CvExtractor, DesignTokenEngine, ComponentPlanner, ReactGenerator, CodeValidator, } from "./index.js";
describe("@aiui/core", () => {
    const sampleColors = {
        dominantBg: "#0F172A",
        surfaceBg: "#1E293B",
        primaryAccent: "#3B82F6",
        textColor: "#F8FAFC",
        mutedColor: "#94A3B8",
    };
    const sampleSections = [
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
        const valRes = CodeValidator.validateJsx(appFile.content, "App.jsx");
        expect(valRes.isValid).toBe(true);
        expect(valRes.errors.length).toBe(0);
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
//# sourceMappingURL=core.test.js.map
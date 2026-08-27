import { describe, it, expect, vi } from "vitest";
import { OpenRouterProvider } from "./openrouterProvider.js";
import { VisualGrounding } from "../analysis/visualGrounding.js";
import { MultiPassVisionAnalyzer } from "../analysis/multiPassAnalyzer.js";
import fs from "node:fs";
import path from "node:path";

describe("OpenRouterProvider & Multi-Pass Vision Analysis Suite", () => {
  it("should initialize OpenRouterProvider with environment variables and defaults", () => {
    process.env.OPENROUTER_API_KEY = "test_key_fake";
    process.env.OPENROUTER_MODEL = "openai/gpt-4o";
    process.env.OPENROUTER_SITE_URL = "https://custom.site";
    process.env.OPENROUTER_SITE_NAME = "CustomApp";

    const provider = new OpenRouterProvider();
    expect(provider.name).toBe("openrouter");

    delete process.env.OPENROUTER_API_KEY;
    delete process.env.OPENROUTER_MODEL;
    delete process.env.OPENROUTER_SITE_URL;
    delete process.env.OPENROUTER_SITE_NAME;
  });

  it("should generate 8x6 grid overlay and crop regions cleanly", async () => {
    const fixturePath = path.resolve(process.cwd(), "fixtures/ugeek-signin/target.png");
    const imageBuffer = fs.readFileSync(fixturePath);

    const { buffer: gridBuffer, width, height } = await VisualGrounding.generateGridOverlay(imageBuffer, 8, 6);
    expect(gridBuffer).toBeDefined();
    expect(gridBuffer.length).toBeGreaterThan(100);
    expect(width).toBeGreaterThan(0);
    expect(height).toBeGreaterThan(0);

    const cropBuffer = await VisualGrounding.cropRegion(imageBuffer, { x: 0, y: 0, width: 300, height: 400 }, width, height);
    expect(cropBuffer).toBeDefined();
    expect(cropBuffer.length).toBeGreaterThan(50);
  });

  it("should execute MultiPassVisionAnalyzer across 4 passes and cap regions at maxRegions", async () => {
    const fixturePath = path.resolve(process.cwd(), "fixtures/ugeek-signin/target.png");
    const imageBuffer = fs.readFileSync(fixturePath);

    let callCount = 0;
    const mockCaller = vi.fn(async (payload) => {
      callCount++;
      if (payload.prompt.includes("UI Vision Decomposition")) {
        // Pass 1: return 10 regions (exceeds max of 4 for test to check capping)
        return {
          text: JSON.stringify({
            rootLayout: { display: "flex", flexDirection: "row", alignItems: "stretch" },
            regions: Array.from({ length: 10 }, (_, i) => ({
              id: `panel_${i + 1}`,
              name: `Panel ${i + 1}`,
              role: "section",
              gridRange: "A1:D6",
              widthPercent: "25%",
            })),
          }),
          promptTokens: 500,
          completionTokens: 200,
          costUsd: 0.003,
          latencyMs: 120,
        };
      }
      if (payload.prompt.includes("UI Element Perception")) {
        // Pass 2: return elements for region
        return {
          text: JSON.stringify({
            elements: [
              { id: "test_heading", type: "heading", text: "Welcome Back" },
              { id: "test_email", type: "input", placeholder: "Email address", inputType: "email" },
              { id: "test_btn", type: "button", text: "Sign In", variant: "primary" },
            ],
          }),
          promptTokens: 400,
          completionTokens: 150,
          costUsd: 0.002,
          latencyMs: 100,
        };
      }
      if (payload.prompt.includes("Design System Token")) {
        // Pass 3: tokens
        return {
          text: JSON.stringify({
            dominantBg: "#0F172A",
            surfaceBg: "#1E293B",
            primaryAccent: "#3B82F6",
            textColor: "#F8FAFC",
          }),
          promptTokens: 300,
          completionTokens: 100,
          costUsd: 0.001,
          latencyMs: 80,
        };
      }
      // Pass 4: critique
      return {
        text: JSON.stringify({
          accurate: true,
          missingElements: [],
        }),
        promptTokens: 600,
        completionTokens: 80,
        costUsd: 0.002,
        latencyMs: 90,
      };
    });

    const result = await MultiPassVisionAnalyzer.analyze(
      imageBuffer,
      "image/png",
      { width: 1280, height: 800 },
      "Test Multi-Pass",
      mockCaller,
      {
        providerName: "openrouter",
        modelName: "openai/gpt-4o",
        maxRegions: 4, // Explicitly capped at 4
        stage: "analyzing",
      }
    );

    expect(result.data).toBeDefined();
    expect(result.data.rootNodeId).toBe("page_root");
    expect(result.data.nodes["page_root"]).toBeDefined();
    // Verify capped at 4 regions
    expect(result.data.nodes["page_root"].childIds.length).toBe(4);

    // Verify calls: Pass 1 (1) + Pass 2 (4 regions) + Pass 3 (1) + Pass 4 (1) = 7 calls
    expect(callCount).toBe(7);
    expect(result.costLog.promptTokens).toBeGreaterThan(0);
    expect(result.costLog.completionTokens).toBeGreaterThan(0);
    expect(result.costLog.estimatedCostUsd).toBeGreaterThan(0);
  });

  it("should transparently surface error metadata when provider call fails", async () => {
    const fixturePath = path.resolve(process.cwd(), "fixtures/ugeek-signin/target.png");
    const imageBuffer = fs.readFileSync(fixturePath);

    const provider = new OpenRouterProvider("invalid_key");
    const result = await provider.analyzeScreenshot(imageBuffer, "image/png", { width: 1280, height: 800 });

    expect(result.data).toBeDefined();
    expect(result.costLog.provider).toContain("fallback: offline-cv");
    expect((result.costLog as any).error).toBeDefined();
    expect((result.data.metadata as any).vlmError).toBeDefined();
    expect((result.data.metadata as any).fallbackReason).toBe("vlm_call_failed");
  });
});

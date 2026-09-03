import "dotenv/config";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { PuterProvider } from "./puterProvider.js";
import fs from "node:fs";
import path from "node:path";

describe("PuterProvider Suite", () => {
  const origEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...origEnv };
  });

  afterEach(() => {
    process.env = origEnv;
    vi.restoreAllMocks();
  });

  it("initializes with default model and properties", () => {
    delete process.env.PUTER_AUTH_TOKEN;
    const provider = new PuterProvider(undefined, "gemini-2.5-flash");
    expect(provider.name).toBe("puter");
    expect(provider.displayName).toBe("Puter (Gemini)");
    expect(provider.modelId).toBe("gemini-2.5-flash");
    expect(provider.isConfigured()).toBe(false);
  });

  it("detects configuration when PUTER_AUTH_TOKEN is present", () => {
    process.env.PUTER_AUTH_TOKEN = "valid_test_token";
    const provider = new PuterProvider();
    expect(provider.isConfigured()).toBe(true);
  });

  it("handles fallback to Offline CV gracefully when unconfigured", async () => {
    delete process.env.PUTER_AUTH_TOKEN;
    delete process.env.OPENROUTER_API_KEY;

    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const provider = new PuterProvider(undefined, undefined, true);

    const dummyPng = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      "base64"
    );

    const result = await provider.analyzeScreenshot(
      dummyPng,
      "image/png",
      { width: 1280, height: 800 },
      "analyzing",
      "test"
    );

    expect(result).toBeDefined();
    expect(result.data.rootNodeId).toBeDefined();
    expect(result.costLog.provider).toContain("fallback");
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("[AIUI][PUTER]")
    );
  });

  it("handles structured correction fallback gracefully when unconfigured", async () => {
    delete process.env.PUTER_AUTH_TOKEN;
    delete process.env.OPENROUTER_API_KEY;

    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const provider = new PuterProvider();

    const result = await provider.generateStructuredCorrection("Refine spacing for button");
    expect(result).toBeDefined();
    expect(result.data).toBeDefined();
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("[AIUI][PUTER]")
    );
  });

  it(
    "executes real live Puter Gemini structured correction when token is available",
    async () => {
      if (!process.env.PUTER_AUTH_TOKEN) {
        console.log("Skipping live Puter test: PUTER_AUTH_TOKEN not in environment");
        return;
      }

      const provider = new PuterProvider();
      expect(provider.isConfigured()).toBe(true);

      const correctionResult = await provider.generateStructuredCorrection(
        "Say 'Puter Gemini Verified' in exactly 3 words."
      );
      expect(correctionResult.data).toContain("Puter");
      expect(correctionResult.costLog.provider).toBe("Puter");
    },
    20000
  );

  it(
    "executes real live Puter Gemini vision analysis when token is available",
    async () => {
      if (!process.env.PUTER_AUTH_TOKEN) {
        console.log("Skipping live Puter vision test: PUTER_AUTH_TOKEN not in environment");
        return;
      }

      const provider = new PuterProvider();
      expect(provider.isConfigured()).toBe(true);

      const fixturePath = path.resolve(process.cwd(), "fixtures/card-ui/target.png");
      if (fs.existsSync(fixturePath)) {
        const imgBuffer = fs.readFileSync(fixturePath);
        const visionResult = await provider.analyzeScreenshot(
          imgBuffer,
          "image/png",
          { width: 1280, height: 800 },
          "analyzing",
          "Puter Live Card UI"
        );
        expect(visionResult.data.rootNodeId).toBeDefined();
        expect(Object.keys(visionResult.data.nodes).length).toBeGreaterThan(0);
        expect(visionResult.costLog.provider).toBe("Puter");
      }
    },
    120000
  );

  it("executes direct chat and analyzeImage methods when configured", async () => {
    if (!process.env.PUTER_AUTH_TOKEN) {
      console.log("Skipping direct chat test: PUTER_AUTH_TOKEN not in environment");
      return;
    }

    const provider = new PuterProvider();
    const chatRes = await provider.chat({ prompt: "Hello from AIUI" });
    expect(chatRes.text.length).toBeGreaterThan(0);
    expect(chatRes.provider).toBe("Puter");

    const dummyPng = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      "base64"
    );
    const visionRes = await provider.analyzeImage({
      image: dummyPng,
      prompt: "What is this image?",
    });
    expect(visionRes.text.length).toBeGreaterThan(0);
    expect(visionRes.provider).toBe("Puter");
  }, 30000);
});

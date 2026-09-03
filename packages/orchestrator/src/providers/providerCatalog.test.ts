import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  getAvailableProviders,
  createProvider,
  PuterProvider,
  GeminiProvider,
  OpenAIProvider,
  OpenRouterProvider,
  AnthropicProvider,
  OfflineCvProvider,
} from "./index.js";

describe("Provider Catalog & Multi-Model Factory Suite", () => {
  const origEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...origEnv };
  });

  afterEach(() => {
    process.env = origEnv;
  });

  it("should list all supported providers in the catalog with correct attributes", () => {
    process.env.OPENROUTER_API_KEY = "test_or_key";
    process.env.GEMMA_MODEL = "google/gemma-3-27b-it:free";
    delete process.env.PUTER_AUTH_TOKEN;
    delete process.env.GEMINI_API_KEY;
    delete process.env.OPENAI_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;

    const catalog = getAvailableProviders();
    expect(catalog.length).toBe(6);

    const gemmaEntry = catalog.find((p) => p.id === "gemma");
    expect(gemmaEntry).toBeDefined();
    expect(gemmaEntry?.isFree).toBe(true);
    expect(gemmaEntry?.isConfigured).toBe(true);
    expect(gemmaEntry?.defaultModel).toBe("google/gemma-3-27b-it:free");

    const puterEntry = catalog.find((p) => p.id === "puter");
    expect(puterEntry).toBeDefined();
    expect(puterEntry?.displayName).toBe("Puter (Gemini)");
    expect(puterEntry?.isFree).toBe(true);
    expect(puterEntry?.requiresKey).toBe(false);
    expect(puterEntry?.isConfigured).toBe(false);

    const geminiEntry = catalog.find((p) => p.id === "gemini");
    expect(geminiEntry?.isConfigured).toBe(false);

    const offlineEntry = catalog.find((p) => p.id === "offline");
    expect(offlineEntry?.isConfigured).toBe(true);
    expect(offlineEntry?.requiresKey).toBe(false);
  });

  it("should ensure GEMMA_MODEL is strictly env-driven with zero hardcoded model slug fallback", () => {
    delete process.env.GEMMA_MODEL;
    delete process.env.OPENROUTER_MODEL;

    // Creating gemma without env vars or arguments must not bake in any fallback slug
    const gemmaProvider = createProvider("gemma");
    expect(gemmaProvider.name).toBe("gemma");
    expect(gemmaProvider.modelId).toBe("");
    expect(gemmaProvider.isConfigured?.()).toBe(false);

    // Now set env var
    process.env.OPENROUTER_API_KEY = "sk-test";
    process.env.GEMMA_MODEL = "google/gemma-2-9b-it:free";
    const configuredGemma = createProvider("gemma");
    expect(configuredGemma.modelId).toBe("google/gemma-2-9b-it:free");
    expect(configuredGemma.isConfigured?.()).toBe(true);
  });

  it("should instantiate GeminiProvider with Gemini model and clean API key check", () => {
    delete process.env.GEMINI_API_KEY;
    const unconfigured = createProvider("gemini");
    expect(unconfigured instanceof GeminiProvider).toBe(true);
    expect(unconfigured.isConfigured?.()).toBe(false);

    process.env.GEMINI_API_KEY = "fake_gemini_key";
    process.env.GEMINI_MODEL = "gemini-2.5-flash";
    const configured = createProvider("gemini");
    expect(configured.isConfigured?.()).toBe(true);
    expect(configured.modelId).toBe("gemini-2.5-flash");
    expect(configured.displayName).toBe("Google Gemini");
  });

  it("should instantiate OpenAIProvider with model override", () => {
    process.env.OPENAI_API_KEY = "sk-fake-openai";
    process.env.OPENAI_MODEL = "gpt-4o-mini";
    const provider = createProvider("openai");
    expect(provider instanceof OpenAIProvider).toBe(true);
    expect(provider.isConfigured?.()).toBe(true);
    expect(provider.modelId).toBe("gpt-4o-mini");
    expect(provider.displayName).toBe("OpenAI GPT-4o");
  });

  it("should instantiate AnthropicProvider with model override and config check", () => {
    delete process.env.ANTHROPIC_API_KEY;
    const unconfigured = createProvider("anthropic");
    expect(unconfigured instanceof AnthropicProvider).toBe(true);
    expect(unconfigured.isConfigured?.()).toBe(false);

    process.env.ANTHROPIC_API_KEY = "sk-ant-fake";
    process.env.ANTHROPIC_MODEL = "claude-3-7-sonnet";
    const configured = createProvider("anthropic");
    expect(configured instanceof AnthropicProvider).toBe(true);
    expect(configured.isConfigured?.()).toBe(true);
    expect(configured.modelId).toBe("claude-3-7-sonnet");
    expect(configured.displayName).toBe("Anthropic Claude");
  });

  it("should instantiate OfflineCvProvider when explicitly requested or as fallback", () => {
    const offline = createProvider("offline");
    expect(offline instanceof OfflineCvProvider).toBe(true);
    expect(offline.isConfigured?.()).toBe(true);
    expect(offline.displayName).toBe("Offline CV Engine");

    // Clean env to ensure default fallback is OfflineCvProvider
    delete process.env.OPENROUTER_API_KEY;
    delete process.env.GEMINI_API_KEY;
    delete process.env.OPENAI_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    const defaultFallback = createProvider();
    expect(defaultFallback instanceof OfflineCvProvider).toBe(true);
  });

  it("should instantiate PuterProvider with Puter model and auth token check", () => {
    delete process.env.PUTER_AUTH_TOKEN;
    const unconfigured = createProvider("puter");
    expect(unconfigured instanceof PuterProvider).toBe(true);
    expect(unconfigured.isConfigured?.()).toBe(false);

    process.env.PUTER_AUTH_TOKEN = "test_token_puter";
    process.env.PUTER_MODEL = "gemini-2.5-flash";
    const configured = createProvider("puter");
    expect(configured instanceof PuterProvider).toBe(true);
    expect(configured.isConfigured?.()).toBe(true);
    expect(configured.modelId).toBe("gemini-2.5-flash");
    expect(configured.displayName).toBe("Puter (Gemini)");
  });
});

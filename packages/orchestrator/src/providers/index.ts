import { VisionProvider, LLMProvider } from "./types.js";
import { GeminiProvider } from "./geminiProvider.js";
import { OpenAIProvider } from "./openaiProvider.js";
import { OpenRouterProvider } from "./openrouterProvider.js";
import { AnthropicProvider } from "./anthropicProvider.js";
import { PuterProvider } from "./puterProvider.js";
import { OfflineCvProvider } from "./offlineCvProvider.js";

export * from "./types.js";
export * from "./geminiProvider.js";
export * from "./openaiProvider.js";
export * from "./openrouterProvider.js";
export * from "./anthropicProvider.js";
export * from "./puterProvider.js";
export * from "./offlineCvProvider.js";

import { SupportedProviderName } from "../types.js";

export interface ProviderCatalogEntry {
  id: SupportedProviderName;
  name: string;
  displayName: string;
  defaultModel: string;
  isFree: boolean;
  requiresKey: boolean;
  isConfigured: boolean;
}

export function getAvailableProviders(): ProviderCatalogEntry[] {
  return [
    {
      id: "gemma",
      name: "gemma",
      displayName: "Gemma (Free)",
      defaultModel: process.env.GEMMA_MODEL || "",
      isFree: true,
      requiresKey: true,
      isConfigured: Boolean(process.env.OPENROUTER_API_KEY && process.env.GEMMA_MODEL),
    },
    {
      id: "puter",
      name: "puter",
      displayName: "Puter (Gemini)",
      defaultModel: process.env.PUTER_MODEL || "gemini-2.5-flash",
      isFree: true,
      requiresKey: false,
      isConfigured: Boolean(process.env.PUTER_AUTH_TOKEN),
    },
    {
      id: "gemini",
      name: "gemini",
      displayName: "Google Gemini",
      defaultModel: process.env.GEMINI_MODEL || "gemini-1.5-flash",
      isFree: false,
      requiresKey: true,
      isConfigured: Boolean(process.env.GEMINI_API_KEY),
    },
    {
      id: "openai",
      name: "openai",
      displayName: "OpenAI GPT-4o",
      defaultModel: process.env.OPENAI_MODEL || "gpt-4o",
      isFree: false,
      requiresKey: true,
      isConfigured: Boolean(process.env.OPENAI_API_KEY),
    },
    {
      id: "anthropic",
      name: "anthropic",
      displayName: "Anthropic Claude",
      defaultModel: process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-20241022",
      isFree: false,
      requiresKey: true,
      isConfigured: Boolean(process.env.ANTHROPIC_API_KEY),
    },
    {
      id: "offline",
      name: "offline",
      displayName: "Offline CV Engine",
      defaultModel: "deterministic-cv-engine",
      isFree: true,
      requiresKey: false,
      isConfigured: true,
    },
  ];
}

export function createProvider(
  name?: string,
  options?: { model?: string; apiKey?: string; allowFallback?: boolean }
): VisionProvider & LLMProvider {
  const envDefault = process.env.AI_PROVIDER || process.env.DEFAULT_PROVIDER;
  const normName = (name || envDefault || "").toLowerCase().trim();

  // Explicit provider selection
  if (normName === "gemma") {
    return new OpenRouterProvider(
      options?.apiKey,
      options?.model,
      options?.allowFallback,
      "gemma",
      "Gemma"
    );
  }
  if (normName === "puter") {
    return new PuterProvider(options?.apiKey, options?.model, options?.allowFallback);
  }
  if (normName === "gemini") {
    return new GeminiProvider(options?.apiKey, options?.model);
  }
  if (normName === "openai") {
    return new OpenAIProvider(options?.apiKey, options?.model);
  }
  if (normName === "anthropic") {
    return new AnthropicProvider(options?.apiKey, options?.model);
  }
  if (normName === "openrouter") {
    return new OpenRouterProvider(options?.apiKey, options?.model, options?.allowFallback);
  }
  if (normName === "offline") {
    return new OfflineCvProvider();
  }

  // Auto-detect default provider based on priority (Gemma -> Puter -> Gemini -> OpenAI -> Anthropic -> OpenRouter -> Offline)
  if (process.env.OPENROUTER_API_KEY && process.env.GEMMA_MODEL) {
    return new OpenRouterProvider(
      options?.apiKey,
      options?.model,
      options?.allowFallback,
      "gemma",
      "Gemma"
    );
  }
  if (process.env.PUTER_AUTH_TOKEN) {
    return new PuterProvider(options?.apiKey, options?.model, options?.allowFallback);
  }
  if (process.env.GEMINI_API_KEY) {
    return new GeminiProvider(options?.apiKey, options?.model);
  }
  if (process.env.OPENAI_API_KEY) {
    return new OpenAIProvider(options?.apiKey, options?.model);
  }
  if (process.env.ANTHROPIC_API_KEY) {
    return new AnthropicProvider(options?.apiKey, options?.model);
  }
  if (process.env.OPENROUTER_API_KEY) {
    return new OpenRouterProvider(options?.apiKey, options?.model, options?.allowFallback);
  }

  return new OfflineCvProvider();
}

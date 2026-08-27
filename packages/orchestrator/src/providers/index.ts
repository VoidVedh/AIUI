import { VisionProvider, LLMProvider } from "./types.js";
import { GeminiProvider } from "./geminiProvider.js";
import { OpenAIProvider } from "./openaiProvider.js";
import { OpenRouterProvider } from "./openrouterProvider.js";
import { OfflineCvProvider } from "./offlineCvProvider.js";

export * from "./types.js";
export * from "./geminiProvider.js";
export * from "./openaiProvider.js";
export * from "./openrouterProvider.js";
export * from "./offlineCvProvider.js";

export function createProvider(name?: string): VisionProvider & LLMProvider {
  if (name === "openrouter" || (!name && process.env.OPENROUTER_API_KEY)) {
    return new OpenRouterProvider();
  }
  if (name === "openai" || (!name && process.env.OPENAI_API_KEY)) {
    return new OpenAIProvider();
  }
  if (name === "gemini" || (!name && process.env.GEMINI_API_KEY)) {
    return new GeminiProvider();
  }
  return new OfflineCvProvider();
}

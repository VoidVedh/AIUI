import { VisionProvider, LLMProvider } from "./types.js";
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
export declare function getAvailableProviders(): ProviderCatalogEntry[];
export declare function createProvider(name?: string, options?: {
    model?: string;
    apiKey?: string;
    allowFallback?: boolean;
}): VisionProvider & LLMProvider;
//# sourceMappingURL=index.d.ts.map
import { UIIRDocument } from "@aiui/core";
import { VisionProvider, LLMProvider, ModelCallResult } from "./types.js";
import { PipelineStage } from "../types.js";
export declare class GeminiProvider implements VisionProvider, LLMProvider {
    readonly name = "gemini";
    private client;
    private fallback;
    constructor(apiKey?: string);
    analyzeScreenshot(imageBuffer: Buffer, mimeType: string, viewport: {
        width: number;
        height: number;
    }, stage?: PipelineStage, name?: string): Promise<ModelCallResult<UIIRDocument>>;
    generateStructuredCorrection(prompt: string, stage?: PipelineStage): Promise<ModelCallResult<string>>;
}
//# sourceMappingURL=geminiProvider.d.ts.map
import { UIIRDocument } from "@aiui/core";
import { VisionProvider, LLMProvider, ModelCallResult } from "./types.js";
import { PipelineStage } from "../types.js";
export declare class OpenAIProvider implements VisionProvider, LLMProvider {
    readonly name = "openai";
    private client;
    private fallback;
    private model;
    constructor(apiKey?: string, model?: string);
    analyzeScreenshot(imageBuffer: Buffer, mimeType: string, viewport: {
        width: number;
        height: number;
    }, stage?: PipelineStage, name?: string): Promise<ModelCallResult<UIIRDocument>>;
    generateStructuredCorrection(prompt: string, stage?: PipelineStage): Promise<ModelCallResult<string>>;
}
//# sourceMappingURL=openaiProvider.d.ts.map
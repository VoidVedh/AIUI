import { UIIRDocument } from "@aiui/core";
import { VisionProvider, LLMProvider, ModelCallResult } from "./types.js";
import { PipelineStage } from "../types.js";
export declare class OfflineCvProvider implements VisionProvider, LLMProvider {
    readonly name = "offline-cv";
    readonly displayName = "Offline CV Engine";
    readonly modelId = "deterministic-cv-engine";
    private adapter;
    isConfigured(): boolean;
    analyzeScreenshot(imageBuffer: Buffer, mimeType: string, viewport: {
        width: number;
        height: number;
    }, stage?: PipelineStage, name?: string): Promise<ModelCallResult<UIIRDocument>>;
    generateStructuredCorrection(prompt: string, stage?: PipelineStage): Promise<ModelCallResult<string>>;
}
//# sourceMappingURL=offlineCvProvider.d.ts.map
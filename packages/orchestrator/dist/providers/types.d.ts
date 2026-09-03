import { UIIRDocument } from "@aiui/core";
import { CostLogEntry, PipelineStage } from "../types.js";
export interface ModelCallResult<T> {
    data: T;
    costLog: CostLogEntry;
}
export interface VisionProvider {
    readonly name: string;
    readonly displayName?: string;
    readonly modelId?: string;
    isConfigured?(): boolean;
    analyzeScreenshot(imageBuffer: Buffer, mimeType: string, viewport: {
        width: number;
        height: number;
    }, stage?: PipelineStage, name?: string): Promise<ModelCallResult<UIIRDocument>>;
}
export interface LLMProvider {
    readonly name: string;
    readonly displayName?: string;
    readonly modelId?: string;
    isConfigured?(): boolean;
    generateStructuredCorrection(prompt: string, stage?: PipelineStage): Promise<ModelCallResult<string>>;
}
//# sourceMappingURL=types.d.ts.map
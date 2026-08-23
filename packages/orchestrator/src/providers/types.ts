import { UIIRDocument } from "@aiui/core";
import { CostLogEntry, PipelineStage } from "../types.js";

export interface ModelCallResult<T> {
  data: T;
  costLog: CostLogEntry;
}

export interface VisionProvider {
  readonly name: string;
  analyzeScreenshot(
    imageBuffer: Buffer,
    mimeType: string,
    viewport: { width: number; height: number },
    stage?: PipelineStage,
    name?: string
  ): Promise<ModelCallResult<UIIRDocument>>;
}

export interface LLMProvider {
  readonly name: string;
  generateStructuredCorrection(
    prompt: string,
    stage?: PipelineStage
  ): Promise<ModelCallResult<string>>;
}

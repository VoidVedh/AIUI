import { UIIRDocument, ScreenshotInputAdapter } from "@aiui/core";
import { VisionProvider, LLMProvider, ModelCallResult } from "./types.js";
import { PipelineStage } from "../types.js";

export class OfflineCvProvider implements VisionProvider, LLMProvider {
  public readonly name = "offline-cv";
  private adapter = new ScreenshotInputAdapter();

  public async analyzeScreenshot(
    imageBuffer: Buffer,
    mimeType: string,
    viewport: { width: number; height: number },
    stage: PipelineStage = "analyzing",
    name?: string
  ): Promise<ModelCallResult<UIIRDocument>> {
    const startTime = Date.now();
    const doc = await this.adapter.parse({
      type: "screenshot",
      data: imageBuffer,
      mimeType,
      name: name || "Screenshot UI",
      viewportHint: viewport,
    });
    const latency = Date.now() - startTime;

    return {
      data: doc,
      costLog: {
        stage,
        provider: this.name,
        model: "deterministic-cv-engine",
        promptTokens: 0,
        completionTokens: 0,
        estimatedCostUsd: 0,
        latencyMs: latency,
        timestamp: new Date().toISOString(),
      },
    };
  }

  public async generateStructuredCorrection(
    prompt: string,
    stage: PipelineStage = "correcting"
  ): Promise<ModelCallResult<string>> {
    const startTime = Date.now();
    const latency = Date.now() - startTime;

    return {
      data: JSON.stringify({ status: "ok", appliedRule: "deterministic-style-patch" }),
      costLog: {
        stage,
        provider: this.name,
        model: "deterministic-cv-engine",
        promptTokens: 0,
        completionTokens: 0,
        estimatedCostUsd: 0,
        latencyMs: latency,
        timestamp: new Date().toISOString(),
      },
    };
  }
}

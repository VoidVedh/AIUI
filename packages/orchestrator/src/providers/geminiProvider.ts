import { GoogleGenerativeAI } from "@google/generative-ai";
import { UIIRDocument } from "@aiui/core";
import { VisionProvider, LLMProvider, ModelCallResult } from "./types.js";
import { OfflineCvProvider } from "./offlineCvProvider.js";
import { PipelineStage } from "../types.js";
import { MultiPassVisionAnalyzer, VisionCallPayload, VisionCallResponse } from "../analysis/multiPassAnalyzer.js";

export class GeminiProvider implements VisionProvider, LLMProvider {
  public readonly name = "gemini";
  public readonly displayName = "Google Gemini";
  public readonly modelId: string;
  private client: GoogleGenerativeAI | null = null;
  private fallback = new OfflineCvProvider();
  private model: string;

  constructor(apiKey?: string, model?: string) {
    const key = apiKey || process.env.GEMINI_API_KEY;
    this.model = model || process.env.GEMINI_MODEL || "gemini-1.5-flash";
    this.modelId = this.model;
    if (key) {
      this.client = new GoogleGenerativeAI(key);
    }
  }

  public isConfigured(): boolean {
    return this.client !== null;
  }

  public async analyzeScreenshot(
    imageBuffer: Buffer,
    mimeType: string,
    viewport: { width: number; height: number },
    stage: PipelineStage = "analyzing",
    name?: string
  ): Promise<ModelCallResult<UIIRDocument>> {
    if (!this.client) {
      if (process.env.STRICT_LIVE_VLM === "true") {
        throw new Error(`[LIVE_PROVIDER_ERROR] Gemini client not initialized (GEMINI_API_KEY missing)`);
      }
      return this.fallback.analyzeScreenshot(imageBuffer, mimeType, viewport, stage, name);
    }

    try {
      const caller = async (payload: VisionCallPayload): Promise<VisionCallResponse> => {
        const callStart = Date.now();
        const genModel = this.client!.getGenerativeModel({
          model: this.model,
          generationConfig: {
            responseMimeType: payload.jsonMode ? "application/json" : "text/plain",
          },
        });

        const parts: any[] = [payload.prompt];
        for (const img of payload.images) {
          parts.push({
            inlineData: {
              data: img.toString("base64"),
              mimeType: payload.mimeType || "image/png",
            },
          });
        }

        const result = await genModel.generateContent(parts);
        const text = result.response.text();
        const latencyMs = Date.now() - callStart;

        const promptTokens = Math.ceil(payload.prompt.length / 4) + 258 * payload.images.length;
        const completionTokens = Math.ceil(text.length / 4);
        const costUsd = (promptTokens * 0.000075 + completionTokens * 0.0003) / 1000;

        return {
          text,
          promptTokens,
          completionTokens,
          costUsd,
          latencyMs,
        };
      };

      return await MultiPassVisionAnalyzer.analyze(
        imageBuffer,
        mimeType,
        viewport,
        name || "Analyzed UI",
        caller,
        {
          providerName: this.name,
          modelName: this.model,
          maxRegions: 8,
          stage,
        }
      );
    } catch (err: any) {
      console.error(`[GeminiProvider Error] Live VLM perception call failed: ${err.message}`);

      // Fallback with transparent error metadata - never mask errors silently
      const fallbackResult = await this.fallback.analyzeScreenshot(imageBuffer, mimeType, viewport, stage, name);
      fallbackResult.costLog.provider = `${this.name} (fallback: offline-cv)`;
      (fallbackResult.costLog as any).error = err.message;
      (fallbackResult.data.metadata as any).vlmError = err.message;
      (fallbackResult.data.metadata as any).fallbackReason = "vlm_call_failed";
      return fallbackResult;
    }
  }

  public async generateStructuredCorrection(
    prompt: string,
    stage: PipelineStage = "correcting"
  ): Promise<ModelCallResult<string>> {
    if (!this.client) {
      return this.fallback.generateStructuredCorrection(prompt, stage);
    }

    const startTime = Date.now();
    try {
      const model = this.client.getGenerativeModel({ model: this.model });
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();

      const latency = Date.now() - startTime;
      const promptTokens = Math.ceil(prompt.length / 4);
      const completionTokens = Math.ceil(responseText.length / 4);
      const costUsd = (promptTokens * 0.000075 + completionTokens * 0.0003) / 1000;

      return {
        data: responseText,
        costLog: {
          stage,
          provider: this.name,
          model: this.model,
          promptTokens,
          completionTokens,
          estimatedCostUsd: Number(costUsd.toFixed(6)),
          latencyMs: latency,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (err: any) {
      console.error(`[GeminiProvider Error] Structured correction failed: ${err.message}`);
      return this.fallback.generateStructuredCorrection(prompt, stage);
    }
  }
}

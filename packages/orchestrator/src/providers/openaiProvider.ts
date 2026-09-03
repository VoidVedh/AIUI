import OpenAI from "openai";
import { UIIRDocument } from "@aiui/core";
import { VisionProvider, LLMProvider, ModelCallResult } from "./types.js";
import { OfflineCvProvider } from "./offlineCvProvider.js";
import { PipelineStage } from "../types.js";
import { MultiPassVisionAnalyzer, VisionCallPayload, VisionCallResponse } from "../analysis/multiPassAnalyzer.js";

export class OpenAIProvider implements VisionProvider, LLMProvider {
  public readonly name = "openai";
  public readonly displayName = "OpenAI GPT-4o";
  public readonly modelId: string;
  private client: OpenAI | null = null;
  private fallback = new OfflineCvProvider();
  private model: string;

  constructor(apiKey?: string, model?: string) {
    const key = apiKey || process.env.OPENAI_API_KEY;
    this.model = model || process.env.OPENAI_MODEL || "gpt-4o";
    this.modelId = this.model;
    if (key) {
      this.client = new OpenAI({ apiKey: key });
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
        throw new Error(`[LIVE_PROVIDER_ERROR] OpenAI client not initialized (OPENAI_API_KEY missing)`);
      }
      return this.fallback.analyzeScreenshot(imageBuffer, mimeType, viewport, stage, name);
    }

    try {
      const caller = async (payload: VisionCallPayload): Promise<VisionCallResponse> => {
        const callStart = Date.now();
        const content: any[] = [{ type: "text", text: payload.prompt }];

        for (const img of payload.images) {
          const b64 = `data:${payload.mimeType || "image/png"};base64,${img.toString("base64")}`;
          content.push({ type: "image_url", image_url: { url: b64 } });
        }

        const completion = await this.client!.chat.completions.create({
          model: this.model,
          messages: [{ role: "user", content }],
          response_format: payload.jsonMode ? { type: "json_object" } : undefined,
        });

        const text = completion.choices[0]?.message?.content || "{}";
        const promptTokens = completion.usage?.prompt_tokens || Math.ceil(payload.prompt.length / 4) + 800;
        const completionTokens = completion.usage?.completion_tokens || Math.ceil(text.length / 4);
        const latencyMs = Date.now() - callStart;

        const costUsd = (promptTokens * 0.0025 + completionTokens * 0.01) / 1000;

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
      console.error(`[OpenAIProvider Error] Live VLM perception call failed: ${err.message}`);

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
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [{ role: "user", content: prompt }],
      });

      const content = response.choices[0]?.message?.content || "";
      const latency = Date.now() - startTime;
      const promptTokens = response.usage?.prompt_tokens || 300;
      const completionTokens = response.usage?.completion_tokens || 100;
      const costUsd = (promptTokens * 0.0025 + completionTokens * 0.01) / 1000;

      return {
        data: content,
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
      console.error(`[OpenAIProvider Error] Structured correction failed: ${err.message}`);
      return this.fallback.generateStructuredCorrection(prompt, stage);
    }
  }
}

import OpenAI from "openai";
import { UIIRDocument } from "@aiui/core";
import { VisionProvider, LLMProvider, ModelCallResult } from "./types.js";
import { OfflineCvProvider } from "./offlineCvProvider.js";
import { PipelineStage } from "../types.js";
import { FusionPerceptionEngine, VisionCallPayload, VisionCallResponse } from "../analysis/fusionPerceptionEngine.js";

export class OpenRouterProvider implements VisionProvider, LLMProvider {
  public readonly name = "openrouter";
  private client: OpenAI | null = null;
  private fallback = new OfflineCvProvider();
  private model: string;
  private allowFallback: boolean;

  constructor(apiKey?: string, model?: string, allowFallback = true) {
    const key = apiKey || process.env.OPENROUTER_API_KEY;
    this.model = model || process.env.OPENROUTER_MODEL || "openrouter/free";
    this.allowFallback = allowFallback && process.env.STRICT_LIVE_VLM !== "true";

    if (key) {
      const siteUrl = process.env.OPENROUTER_SITE_URL || process.env.APP_URL || "https://aiui.dev";
      const siteName = process.env.OPENROUTER_SITE_NAME || process.env.APP_NAME || "AIUI - Autonomous UI-to-Code";

      this.client = new OpenAI({
        apiKey: key,
        baseURL: "https://openrouter.ai/api/v1",
        defaultHeaders: {
          "HTTP-Referer": siteUrl,
          "X-Title": siteName,
        },
      });
    }
  }

  public async analyzeScreenshot(
    imageBuffer: Buffer,
    mimeType: string,
    viewport: { width: number; height: number },
    stage: PipelineStage = "analyzing",
    name?: string
  ): Promise<ModelCallResult<UIIRDocument>> {
    if (!this.client) {
      if (!this.allowFallback) {
        throw new Error(`[LIVE_PROVIDER_ERROR] OpenRouter client not initialized (OPENROUTER_API_KEY missing)`);
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

        const maxTokens = Number(process.env.OPENROUTER_MAX_TOKENS) || 2000;
        let completion: any;
        try {
          completion = await this.client!.chat.completions.create({
            model: this.model,
            messages: [{ role: "user", content }],
            response_format: payload.jsonMode ? { type: "json_object" } : undefined,
            max_tokens: maxTokens,
          });
        } catch (callErr: any) {
          if (this.model === "openrouter/free" && (callErr.message.includes("404") || callErr.status === 404)) {
            completion = await this.client!.chat.completions.create({
              model: "minimax/minimax-m3:free",
              messages: [{ role: "user", content }],
              response_format: payload.jsonMode ? { type: "json_object" } : undefined,
              max_tokens: maxTokens,
            });
          } else {
            throw callErr;
          }
        }

        const text = completion.choices[0]?.message?.content || "{}";
        const promptTokens = completion.usage?.prompt_tokens || Math.ceil(payload.prompt.length / 4) + 800;
        const completionTokens = completion.usage?.completion_tokens || Math.ceil(text.length / 4);
        const latencyMs = Date.now() - callStart;

        // Pricing: Use actual cost from OpenRouter API if available, else estimate
        const costUsd = (completion.usage as any)?.cost !== undefined
          ? Number((completion.usage as any).cost)
          : (promptTokens * 0.0025 + completionTokens * 0.01) / 1000;

        return {
          text,
          promptTokens,
          completionTokens,
          costUsd,
          latencyMs,
        };
      };

      return await FusionPerceptionEngine.analyze(
        imageBuffer,
        mimeType,
        viewport,
        name || "Analyzed UI",
        caller,
        {
          providerName: this.name,
          modelName: this.model,
          stage,
        }
      );
    } catch (err: any) {
      console.error(`[OpenRouterProvider Error] Live OpenRouter VLM perception call failed: ${err.message}`);

      if (!this.allowFallback) {
        const httpStatus = err.status || err.statusCode || (err.message.includes("402") ? 402 : "UNKNOWN");
        throw new Error(
          `[LIVE_PROVIDER_ERROR]\nHTTP: ${httpStatus}\nMessage: ${err.message}\nModel: ${this.model}\nRequested max tokens: ${process.env.OPENROUTER_MAX_TOKENS || 2000}\nFallback used: NO`
        );
      }

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
      if (!this.allowFallback) {
        throw new Error(`[LIVE_PROVIDER_ERROR] OpenRouter client not initialized for structured correction`);
      }
      return this.fallback.generateStructuredCorrection(prompt, stage);
    }

    const startTime = Date.now();
    try {
      const maxTokens = Number(process.env.OPENROUTER_MAX_TOKENS) || 2000;
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [{ role: "user", content: prompt }],
        max_tokens: maxTokens,
      });

      const content = response.choices[0]?.message?.content || "";
      const latency = Date.now() - startTime;
      const promptTokens = response.usage?.prompt_tokens || 300;
      const completionTokens = response.usage?.completion_tokens || 100;
      const costUsd = (response.usage as any)?.cost !== undefined
        ? Number((response.usage as any).cost)
        : (promptTokens * 0.0025 + completionTokens * 0.01) / 1000;

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
      console.error(`[OpenRouterProvider Error] Structured correction failed: ${err.message}`);
      if (!this.allowFallback) {
        throw new Error(`[LIVE_PROVIDER_ERROR] Structured correction failed: ${err.message}`);
      }
      return this.fallback.generateStructuredCorrection(prompt, stage);
    }
  }
}

import { createRequire } from "node:module";
import { UIIRDocument } from "@aiui/core";
import { VisionProvider, LLMProvider, ModelCallResult } from "./types.js";
import { OfflineCvProvider } from "./offlineCvProvider.js";
import { OpenRouterProvider } from "./openrouterProvider.js";
import { PipelineStage } from "../types.js";
import { MultiPassVisionAnalyzer, VisionCallPayload, VisionCallResponse } from "../analysis/multiPassAnalyzer.js";

const require = createRequire(import.meta.url);

export class PuterProvider implements VisionProvider, LLMProvider {
  public readonly name = "puter";
  public readonly displayName = "Puter (Gemini)";
  public readonly modelId: string;
  private puter: any = null;
  private model: string;
  private allowFallback: boolean;
  private openrouterFallback: OpenRouterProvider;
  private offlineFallback = new OfflineCvProvider();

  constructor(apiKey?: string, model?: string, allowFallback = true) {
    const token = apiKey || process.env.PUTER_AUTH_TOKEN;
    this.model = model || process.env.PUTER_MODEL || "gemini-2.5-flash";
    this.modelId = this.model;
    this.allowFallback = allowFallback && process.env.STRICT_LIVE_VLM !== "true";
    this.openrouterFallback = new OpenRouterProvider(undefined, undefined, allowFallback);

    try {
      const { init } = require("@heyputer/puter.js/src/init.cjs");
      if (token) {
        this.puter = init(token);
      } else {
        // Attempt ambient / browser-linked token initialization
        this.puter = init();
      }
    } catch (err: any) {
      this.puter = null;
    }
  }

  public isConfigured(): boolean {
    return Boolean(this.puter && (process.env.PUTER_AUTH_TOKEN || this.puter?.authToken));
  }

  public async analyzeScreenshot(
    imageBuffer: Buffer,
    mimeType: string,
    viewport: { width: number; height: number },
    stage: PipelineStage = "analyzing",
    name?: string
  ): Promise<ModelCallResult<UIIRDocument>> {
    if (!this.puter || !this.isConfigured()) {
      const fallbackTarget = this.openrouterFallback.isConfigured() ? "OpenRouter" : "Offline CV";
      console.warn(
        `[AIUI][PUTER]\nProvider: Puter\nModel: Gemini (${this.model})\nStatus: FAILED\nError: Puter client not configured (PUTER_AUTH_TOKEN missing)\nFallback: ${fallbackTarget}`
      );
      if (process.env.STRICT_LIVE_VLM === "true") {
        throw new Error(`[LIVE_PROVIDER_ERROR] Puter client not initialized (PUTER_AUTH_TOKEN missing)`);
      }
      return this.executeFallbackVision(imageBuffer, mimeType, viewport, stage, name, "Puter client not configured");
    }

    const startTotal = Date.now();
    try {
      const caller = async (payload: VisionCallPayload): Promise<VisionCallResponse> => {
        const callStart = Date.now();
        let prompt = payload.prompt;
        if (payload.jsonMode && !prompt.includes("JSON")) {
          prompt += "\n\nRespond strictly in valid JSON format without markdown code fences.";
        }

        const dataUrls = payload.images.map(
          (img) => `data:${payload.mimeType || "image/png"};base64,${img.toString("base64")}`
        );

        let res: any;
        if (dataUrls.length === 1) {
          res = await this.puter.ai.chat(prompt, dataUrls[0], { model: this.model });
        } else if (dataUrls.length > 1) {
          res = await this.puter.ai.chat(prompt, dataUrls, { model: this.model });
        } else {
          res = await this.puter.ai.chat(prompt, { model: this.model });
        }

        const text = typeof res === "string" ? res : res?.message?.content || "";
        const latencyMs = Date.now() - callStart;

        const promptTokens =
          res?.usage?.prompt_tokens || Math.ceil(prompt.length / 4) + 258 * payload.images.length;
        const completionTokens = res?.usage?.completion_tokens || Math.ceil(text.length / 4);
        const costUsd = res?.usage?.usd_cents != null ? res.usage.usd_cents / 100 : 0;

        return {
          text,
          promptTokens,
          completionTokens,
          costUsd,
          latencyMs,
        };
      };

      const result = await MultiPassVisionAnalyzer.analyze(
        imageBuffer,
        mimeType,
        viewport,
        name || "Analyzed UI",
        caller,
        {
          providerName: "Puter",
          modelName: this.model,
          maxRegions: 4,
          stage,
        }
      );

      const totalLatency = Date.now() - startTotal;
      console.log(
        `[AIUI][PUTER] Vision (model=${this.model}): status=SUCCESS, latency=${totalLatency}ms.`
      );
      console.log(
        `[AIUI][PUTER]\nProvider: Puter\nModel: Gemini (${this.model})\nRequest: Vision\nStatus: SUCCESS\nLatency: ${totalLatency} ms\nFallback: NONE`
      );

      result.costLog.provider = "Puter";
      result.costLog.model = this.model;
      return result;
    } catch (err: any) {
      const fallbackTarget = this.openrouterFallback.isConfigured() ? "OpenRouter" : "Offline CV";
      console.error(
        `[AIUI][PUTER] Vision: status=FAILED (${err.message}), falling back to ${fallbackTarget}.`
      );
      console.error(
        `[AIUI][PUTER]\nProvider: Puter\nModel: Gemini (${this.model})\nStatus: FAILED\nError: ${err.message}\nFallback: ${fallbackTarget}`
      );

      if (!this.allowFallback) {
        throw err;
      }

      return this.executeFallbackVision(imageBuffer, mimeType, viewport, stage, name, err.message);
    }
  }

  public async generateStructuredCorrection(
    prompt: string,
    stage: PipelineStage = "correcting"
  ): Promise<ModelCallResult<string>> {
    if (!this.puter || !this.isConfigured()) {
      const fallbackTarget = this.openrouterFallback.isConfigured() ? "OpenRouter" : "Offline CV";
      console.warn(
        `[AIUI][PUTER] Chat: status=FAILED (Puter client not configured), falling back to ${fallbackTarget}.`
      );
      console.warn(
        `[AIUI][PUTER]\nProvider: Puter\nModel: Gemini (${this.model})\nStatus: FAILED\nError: Puter client not configured\nFallback: ${fallbackTarget}`
      );
      if (this.openrouterFallback.isConfigured()) {
        return this.openrouterFallback.generateStructuredCorrection(prompt, stage);
      }
      return this.offlineFallback.generateStructuredCorrection(prompt, stage);
    }

    const callStart = Date.now();
    try {
      const res = await this.puter.ai.chat(prompt, { model: this.model });
      const text = typeof res === "string" ? res : res?.message?.content || "";
      const latencyMs = Date.now() - callStart;

      console.log(
        `[AIUI][PUTER] Chat (model=${this.model}): status=SUCCESS, latency=${latencyMs}ms.`
      );
      console.log(
        `[AIUI][PUTER]\nProvider: Puter\nModel: Gemini (${this.model})\nRequest: Structured Correction\nStatus: SUCCESS\nLatency: ${latencyMs} ms\nFallback: NONE`
      );

      const promptTokens = res?.usage?.prompt_tokens || Math.ceil(prompt.length / 4);
      const completionTokens = res?.usage?.completion_tokens || Math.ceil(text.length / 4);
      const costUsd = res?.usage?.usd_cents != null ? res.usage.usd_cents / 100 : 0;

      return {
        data: text,
        costLog: {
          stage,
          provider: "Puter",
          model: this.model,
          promptTokens,
          completionTokens,
          estimatedCostUsd: Number(costUsd.toFixed(6)),
          latencyMs,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (err: any) {
      const fallbackTarget = this.openrouterFallback.isConfigured() ? "OpenRouter" : "Offline CV";
      console.error(
        `[AIUI][PUTER] Chat: status=FAILED (${err.message}), falling back to ${fallbackTarget}.`
      );
      console.error(
        `[AIUI][PUTER]\nProvider: Puter\nModel: Gemini (${this.model})\nStatus: FAILED\nError: ${err.message}\nFallback: ${fallbackTarget}`
      );

      if (this.openrouterFallback.isConfigured()) {
        return this.openrouterFallback.generateStructuredCorrection(prompt, stage);
      }
      return this.offlineFallback.generateStructuredCorrection(prompt, stage);
    }
  }

  /**
   * Direct text chat method conforming to generic AIProvider contract
   */
  public async chat(request: { prompt: string; model?: string }): Promise<{ text: string; latencyMs: number; provider: string; model: string }> {
    const callStart = Date.now();
    const model = request.model || this.model;
    try {
      if (!this.puter || !this.isConfigured()) {
        throw new Error("Puter client not configured (PUTER_AUTH_TOKEN missing)");
      }
      const res = await this.puter.ai.chat(request.prompt, { model });
      const text = typeof res === "string" ? res : res?.message?.content || "";
      const latencyMs = Date.now() - callStart;
      console.log(`[AIUI][PUTER] Chat (model=${model}): status=SUCCESS, latency=${latencyMs}ms.`);
      return { text, latencyMs, provider: "Puter", model };
    } catch (err: any) {
      console.error(`[AIUI][PUTER] Chat: status=FAILED (${err.message}), falling back to OpenRouter.`);
      throw err;
    }
  }

  /**
   * Direct image/vision analysis method conforming to generic AIProvider contract
   */
  public async analyzeImage(request: { image: string | Buffer; prompt: string; model?: string }): Promise<{ text: string; latencyMs: number; provider: string; model: string }> {
    const callStart = Date.now();
    const model = request.model || this.model;
    try {
      if (!this.puter || !this.isConfigured()) {
        throw new Error("Puter client not configured (PUTER_AUTH_TOKEN missing)");
      }
      const dataUrl =
        typeof request.image === "string" && request.image.startsWith("data:")
          ? request.image
          : `data:image/png;base64,${Buffer.isBuffer(request.image) ? request.image.toString("base64") : Buffer.from(request.image).toString("base64")}`;

      const res = await this.puter.ai.chat(request.prompt, dataUrl, { model });
      const text = typeof res === "string" ? res : res?.message?.content || "";
      const latencyMs = Date.now() - callStart;
      console.log(`[AIUI][PUTER] Vision (model=${model}): status=SUCCESS, latency=${latencyMs}ms.`);
      return { text, latencyMs, provider: "Puter", model };
    } catch (err: any) {
      console.error(`[AIUI][PUTER] Vision: status=FAILED (${err.message}), falling back to OpenRouter.`);
      throw err;
    }
  }

  private async executeFallbackVision(
    imageBuffer: Buffer,
    mimeType: string,
    viewport: { width: number; height: number },
    stage: PipelineStage,
    name: string | undefined,
    errorMessage: string
  ): Promise<ModelCallResult<UIIRDocument>> {
    let fallbackResult: ModelCallResult<UIIRDocument>;
    if (this.openrouterFallback.isConfigured()) {
      fallbackResult = await this.openrouterFallback.analyzeScreenshot(imageBuffer, mimeType, viewport, stage, name);
      fallbackResult.costLog.provider = "Puter (fallback: OpenRouter)";
    } else {
      fallbackResult = await this.offlineFallback.analyzeScreenshot(imageBuffer, mimeType, viewport, stage, name);
      fallbackResult.costLog.provider = "Puter (fallback: offline-cv)";
    }

    (fallbackResult.costLog as any).error = errorMessage;
    (fallbackResult.data.metadata as any).vlmError = errorMessage;
    (fallbackResult.data.metadata as any).fallbackReason = "puter_call_failed";
    return fallbackResult;
  }
}

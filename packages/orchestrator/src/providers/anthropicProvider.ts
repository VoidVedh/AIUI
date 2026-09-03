import { UIIRDocument } from "@aiui/core";
import { VisionProvider, LLMProvider, ModelCallResult } from "./types.js";
import { OfflineCvProvider } from "./offlineCvProvider.js";
import { PipelineStage } from "../types.js";
import { MultiPassVisionAnalyzer, VisionCallPayload, VisionCallResponse } from "../analysis/multiPassAnalyzer.js";

export class AnthropicProvider implements VisionProvider, LLMProvider {
  public readonly name = "anthropic";
  public readonly displayName = "Anthropic Claude";
  public readonly modelId: string;
  private apiKey?: string;
  private model: string;
  private fallback = new OfflineCvProvider();

  constructor(apiKey?: string, model?: string) {
    this.apiKey = apiKey || process.env.ANTHROPIC_API_KEY;
    this.model = model || process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-20241022";
    this.modelId = this.model;
  }

  public isConfigured(): boolean {
    return Boolean(this.apiKey);
  }

  public async analyzeScreenshot(
    imageBuffer: Buffer,
    mimeType: string,
    viewport: { width: number; height: number },
    stage: PipelineStage = "analyzing",
    name?: string
  ): Promise<ModelCallResult<UIIRDocument>> {
    if (!this.apiKey) {
      if (process.env.STRICT_LIVE_VLM === "true") {
        throw new Error(`[LIVE_PROVIDER_ERROR] Anthropic client not initialized (ANTHROPIC_API_KEY missing)`);
      }
      return this.fallback.analyzeScreenshot(imageBuffer, mimeType, viewport, stage, name);
    }

    try {
      const caller = async (payload: VisionCallPayload): Promise<VisionCallResponse> => {
        const callStart = Date.now();

        const content: any[] = [];
        for (const img of payload.images) {
          content.push({
            type: "image",
            source: {
              type: "base64",
              media_type: payload.mimeType || "image/png",
              data: img.toString("base64"),
            },
          });
        }
        content.push({ type: "text", text: payload.prompt });

        const maxTokens = Number(process.env.ANTHROPIC_MAX_TOKENS) || 2000;
        const response = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "x-api-key": this.apiKey!,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
          },
          body: JSON.stringify({
            model: this.model,
            max_tokens: maxTokens,
            messages: [{ role: "user", content }],
          }),
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`Anthropic API error (${response.status}): ${errText}`);
        }

        const data = (await response.json()) as any;
        const textBlock = data.content?.find((c: any) => c.type === "text");
        const text = textBlock ? textBlock.text : "{}";

        const promptTokens = data.usage?.input_tokens || Math.ceil(payload.prompt.length / 4) + 800;
        const completionTokens = data.usage?.output_tokens || Math.ceil(text.length / 4);
        const latencyMs = Date.now() - callStart;

        // Claude 3.5 Sonnet pricing: $3/M input, $15/M output
        const costUsd = (promptTokens * 0.003 + completionTokens * 0.015) / 1000;

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
      console.error(`[AnthropicProvider Error] Live VLM perception call failed: ${err.message}`);

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
    if (!this.apiKey) {
      return this.fallback.generateStructuredCorrection(prompt, stage);
    }

    const startTime = Date.now();
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": this.apiKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: 1500,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Anthropic API error (${response.status}): ${errText}`);
      }

      const data = (await response.json()) as any;
      const textBlock = data.content?.find((c: any) => c.type === "text");
      const content = textBlock ? textBlock.text : "";

      const latency = Date.now() - startTime;
      const promptTokens = data.usage?.input_tokens || 300;
      const completionTokens = data.usage?.output_tokens || 100;
      const costUsd = (promptTokens * 0.003 + completionTokens * 0.015) / 1000;

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
      console.error(`[AnthropicProvider Error] Structured correction failed: ${err.message}`);
      return this.fallback.generateStructuredCorrection(prompt, stage);
    }
  }
}

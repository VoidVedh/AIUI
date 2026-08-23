import { GoogleGenerativeAI } from "@google/generative-ai";
import { UIIRDocument, UIIRDocumentSchema } from "@aiui/core";
import { VisionProvider, LLMProvider, ModelCallResult } from "./types.js";
import { OfflineCvProvider } from "./offlineCvProvider.js";
import { PipelineStage } from "../types.js";

export class GeminiProvider implements VisionProvider, LLMProvider {
  public readonly name = "gemini";
  private client: GoogleGenerativeAI | null = null;
  private fallback = new OfflineCvProvider();

  constructor(apiKey?: string) {
    const key = apiKey || process.env.GEMINI_API_KEY;
    if (key) {
      this.client = new GoogleGenerativeAI(key);
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
      return this.fallback.analyzeScreenshot(imageBuffer, mimeType, viewport, stage, name);
    }

    const startTime = Date.now();
    try {
      const model = this.client.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `Analyze this UI screenshot and output a strict JSON conforming to the UI IR schema:
{
  "version": "1.0.0",
  "id": "ir_1",
  "name": "Analyzed UI",
  "viewport": { "width": ${viewport.width}, "height": ${viewport.height}, "devicePixelRatio": 1 },
  "rootNodeId": "root",
  "nodes": { ... },
  "metadata": { "sourceType": "screenshot", "confidence": 0.95, "extractedAt": "${new Date().toISOString()}", "targetFrameworks": ["react"] }
}
Output only pure JSON.`;

      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: imageBuffer.toString("base64"),
            mimeType: mimeType || "image/png",
          },
        },
      ]);

      const responseText = result.response.text();
      const cleanJson = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleanJson);
      const validated = UIIRDocumentSchema.parse(parsed);

      const latency = Date.now() - startTime;
      const promptTokens = Math.ceil(prompt.length / 4) + 258;
      const completionTokens = Math.ceil(responseText.length / 4);
      const costUsd = (promptTokens * 0.000075 + completionTokens * 0.0003) / 1000;

      return {
        data: validated,
        costLog: {
          stage,
          provider: this.name,
          model: "gemini-1.5-flash",
          promptTokens,
          completionTokens,
          estimatedCostUsd: Number(costUsd.toFixed(6)),
          latencyMs: latency,
          timestamp: new Date().toISOString(),
        },
      };
    } catch {
      // Fallback gracefully on model error
      return this.fallback.analyzeScreenshot(imageBuffer, mimeType, viewport, stage);
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
      const model = this.client.getGenerativeModel({ model: "gemini-1.5-flash" });
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
          model: "gemini-1.5-flash",
          promptTokens,
          completionTokens,
          estimatedCostUsd: Number(costUsd.toFixed(6)),
          latencyMs: latency,
          timestamp: new Date().toISOString(),
        },
      };
    } catch {
      return this.fallback.generateStructuredCorrection(prompt, stage);
    }
  }
}

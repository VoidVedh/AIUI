import OpenAI from "openai";
import { UIIRDocumentSchema } from "@aiui/core";
import { OfflineCvProvider } from "./offlineCvProvider.js";
export class OpenAIProvider {
    name = "openai";
    client = null;
    fallback = new OfflineCvProvider();
    constructor(apiKey) {
        const key = apiKey || process.env.OPENAI_API_KEY;
        if (key) {
            this.client = new OpenAI({ apiKey: key });
        }
    }
    async analyzeScreenshot(imageBuffer, mimeType, viewport, stage = "analyzing", name) {
        if (!this.client) {
            return this.fallback.analyzeScreenshot(imageBuffer, mimeType, viewport, stage, name);
        }
        const startTime = Date.now();
        try {
            const base64Image = `data:${mimeType || "image/png"};base64,${imageBuffer.toString("base64")}`;
            const response = await this.client.chat.completions.create({
                model: "gpt-4o",
                messages: [
                    {
                        role: "user",
                        content: [
                            {
                                type: "text",
                                text: `Analyze this UI screenshot and output a strict JSON conforming to the UI IR schema for viewport ${viewport.width}x${viewport.height}. Output only valid JSON.`,
                            },
                            {
                                type: "image_url",
                                image_url: { url: base64Image },
                            },
                        ],
                    },
                ],
                response_format: { type: "json_object" },
            });
            const responseText = response.choices[0]?.message?.content || "{}";
            const parsed = JSON.parse(responseText);
            const validated = UIIRDocumentSchema.parse(parsed);
            const latency = Date.now() - startTime;
            const promptTokens = response.usage?.prompt_tokens || 800;
            const completionTokens = response.usage?.completion_tokens || 400;
            const costUsd = (promptTokens * 0.0025 + completionTokens * 0.01) / 1000;
            return {
                data: validated,
                costLog: {
                    stage,
                    provider: this.name,
                    model: "gpt-4o",
                    promptTokens,
                    completionTokens,
                    estimatedCostUsd: Number(costUsd.toFixed(6)),
                    latencyMs: latency,
                    timestamp: new Date().toISOString(),
                },
            };
        }
        catch {
            return this.fallback.analyzeScreenshot(imageBuffer, mimeType, viewport, stage);
        }
    }
    async generateStructuredCorrection(prompt, stage = "correcting") {
        if (!this.client) {
            return this.fallback.generateStructuredCorrection(prompt, stage);
        }
        const startTime = Date.now();
        try {
            const response = await this.client.chat.completions.create({
                model: "gpt-4o",
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
                    model: "gpt-4o",
                    promptTokens,
                    completionTokens,
                    estimatedCostUsd: Number(costUsd.toFixed(6)),
                    latencyMs: latency,
                    timestamp: new Date().toISOString(),
                },
            };
        }
        catch {
            return this.fallback.generateStructuredCorrection(prompt, stage);
        }
    }
}
//# sourceMappingURL=openaiProvider.js.map
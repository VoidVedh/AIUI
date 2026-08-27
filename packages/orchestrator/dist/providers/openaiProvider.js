import OpenAI from "openai";
import { OfflineCvProvider } from "./offlineCvProvider.js";
import { MultiPassVisionAnalyzer } from "../analysis/multiPassAnalyzer.js";
export class OpenAIProvider {
    name = "openai";
    client = null;
    fallback = new OfflineCvProvider();
    model;
    constructor(apiKey, model = "gpt-4o") {
        const key = apiKey || process.env.OPENAI_API_KEY;
        this.model = model;
        if (key) {
            this.client = new OpenAI({ apiKey: key });
        }
    }
    async analyzeScreenshot(imageBuffer, mimeType, viewport, stage = "analyzing", name) {
        if (!this.client) {
            return this.fallback.analyzeScreenshot(imageBuffer, mimeType, viewport, stage, name);
        }
        try {
            const caller = async (payload) => {
                const callStart = Date.now();
                const content = [{ type: "text", text: payload.prompt }];
                for (const img of payload.images) {
                    const b64 = `data:${payload.mimeType || "image/png"};base64,${img.toString("base64")}`;
                    content.push({ type: "image_url", image_url: { url: b64 } });
                }
                const completion = await this.client.chat.completions.create({
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
            return await MultiPassVisionAnalyzer.analyze(imageBuffer, mimeType, viewport, name || "Analyzed UI", caller, {
                providerName: this.name,
                modelName: this.model,
                maxRegions: 8,
                stage,
            });
        }
        catch (err) {
            console.error(`[OpenAIProvider Error] Live VLM perception call failed: ${err.message}`);
            // Fallback with transparent error metadata - never mask errors silently
            const fallbackResult = await this.fallback.analyzeScreenshot(imageBuffer, mimeType, viewport, stage, name);
            fallbackResult.costLog.provider = `${this.name} (fallback: offline-cv)`;
            fallbackResult.costLog.error = err.message;
            fallbackResult.data.metadata.vlmError = err.message;
            fallbackResult.data.metadata.fallbackReason = "vlm_call_failed";
            return fallbackResult;
        }
    }
    async generateStructuredCorrection(prompt, stage = "correcting") {
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
        }
        catch (err) {
            console.error(`[OpenAIProvider Error] Structured correction failed: ${err.message}`);
            return this.fallback.generateStructuredCorrection(prompt, stage);
        }
    }
}
//# sourceMappingURL=openaiProvider.js.map
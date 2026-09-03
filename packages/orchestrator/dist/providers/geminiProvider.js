import { GoogleGenerativeAI } from "@google/generative-ai";
import { OfflineCvProvider } from "./offlineCvProvider.js";
import { MultiPassVisionAnalyzer } from "../analysis/multiPassAnalyzer.js";
export class GeminiProvider {
    name = "gemini";
    displayName = "Google Gemini";
    modelId;
    client = null;
    fallback = new OfflineCvProvider();
    model;
    constructor(apiKey, model) {
        const key = apiKey || process.env.GEMINI_API_KEY;
        this.model = model || process.env.GEMINI_MODEL || "gemini-1.5-flash";
        this.modelId = this.model;
        if (key) {
            this.client = new GoogleGenerativeAI(key);
        }
    }
    isConfigured() {
        return this.client !== null;
    }
    async analyzeScreenshot(imageBuffer, mimeType, viewport, stage = "analyzing", name) {
        if (!this.client) {
            if (process.env.STRICT_LIVE_VLM === "true") {
                throw new Error(`[LIVE_PROVIDER_ERROR] Gemini client not initialized (GEMINI_API_KEY missing)`);
            }
            return this.fallback.analyzeScreenshot(imageBuffer, mimeType, viewport, stage, name);
        }
        try {
            const caller = async (payload) => {
                const callStart = Date.now();
                const genModel = this.client.getGenerativeModel({
                    model: this.model,
                    generationConfig: {
                        responseMimeType: payload.jsonMode ? "application/json" : "text/plain",
                    },
                });
                const parts = [payload.prompt];
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
            return await MultiPassVisionAnalyzer.analyze(imageBuffer, mimeType, viewport, name || "Analyzed UI", caller, {
                providerName: this.name,
                modelName: this.model,
                maxRegions: 8,
                stage,
            });
        }
        catch (err) {
            console.error(`[GeminiProvider Error] Live VLM perception call failed: ${err.message}`);
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
        }
        catch (err) {
            console.error(`[GeminiProvider Error] Structured correction failed: ${err.message}`);
            return this.fallback.generateStructuredCorrection(prompt, stage);
        }
    }
}
//# sourceMappingURL=geminiProvider.js.map
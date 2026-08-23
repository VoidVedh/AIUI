import { ScreenshotInputAdapter } from "@aiui/core";
export class OfflineCvProvider {
    name = "offline-cv";
    adapter = new ScreenshotInputAdapter();
    async analyzeScreenshot(imageBuffer, mimeType, viewport, stage = "analyzing", name) {
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
    async generateStructuredCorrection(prompt, stage = "correcting") {
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
//# sourceMappingURL=offlineCvProvider.js.map
import express from "express";
import cors from "cors";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import { PipelineOrchestrator, StateManager } from "@aiui/orchestrator";
import { EventStreamManager } from "./eventStream.js";
import { ZipService } from "./zipService.js";
const app = express();
const port = process.env.PORT || 3001;
app.use(cors({ origin: "*" }));
app.use(express.json());
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 20 * 1024 * 1024 }, // 20MB max
});
// Cache of active orchestrators in flight
const activeOrchestrators = new Map();
/**
 * GET /api/health
 */
app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", service: "AIUI Server", time: new Date().toISOString() });
});
/**
 * GET /api/fixtures
 * Lists benchmark fixture presets for easy 1-click test runs
 */
app.get("/api/fixtures", (_req, res) => {
    const fixturesDir = path.resolve(process.cwd(), "fixtures");
    const presets = [
        {
            id: "landing-page",
            name: "SaaS Landing Page",
            category: "Marketing",
            viewport: { width: 1280, height: 800 },
            description: "Header navigation, responsive hero badge & section, and 3-column features card grid.",
            imageUrl: "/api/fixtures/landing-page/image",
        },
        {
            id: "dashboard",
            name: "Analytics Dashboard",
            category: "Product / SaaS",
            viewport: { width: 1280, height: 800 },
            description: "Sidebar navigation, live metrics stats cards, and chart analytics viewport.",
            imageUrl: "/api/fixtures/dashboard/image",
        },
        {
            id: "form-ui",
            name: "Authentication Card",
            category: "Forms / Auth",
            viewport: { width: 1280, height: 800 },
            description: "Center-aligned glassmorphic authentication card with structured inputs and CTA.",
            imageUrl: "/api/fixtures/form-ui/image",
        },
        {
            id: "card-ui",
            name: "Architecture Cards",
            category: "Components",
            viewport: { width: 1280, height: 800 },
            description: "3-column responsive system architecture card grid with typography hierarchy.",
            imageUrl: "/api/fixtures/card-ui/image",
        },
        {
            id: "mobile-ui",
            name: "Mobile App View",
            category: "Mobile",
            viewport: { width: 390, height: 844 },
            description: "Mobile viewport with top app bar, content cards, and bottom navigation tabs.",
            imageUrl: "/api/fixtures/mobile-ui/image",
        },
    ];
    res.json(presets);
});
/**
 * GET /api/fixtures/:name/image
 */
app.get("/api/fixtures/:name/image", (req, res) => {
    const { name } = req.params;
    const fixturePath = path.resolve(process.cwd(), `fixtures/${name}/target.png`);
    if (!fs.existsSync(fixturePath)) {
        return res.status(404).json({ error: `Fixture '${name}' not found` });
    }
    res.setHeader("Content-Type", "image/png");
    fs.createReadStream(fixturePath).pipe(res);
});
/**
 * POST /api/runs
 * Starts an autonomous UI-to-Code pipeline run
 */
app.post("/api/runs", upload.single("image"), async (req, res) => {
    try {
        let imageBuffer;
        let mimeType = "image/png";
        let viewport = { width: 1280, height: 800 };
        const target = req.body.target || "react";
        const maxIterations = parseInt(req.body.maxIterations || "5", 10);
        const similarityThreshold = parseFloat(req.body.similarityThreshold || "0.92");
        if (req.body.viewport) {
            try {
                viewport = typeof req.body.viewport === "string" ? JSON.parse(req.body.viewport) : req.body.viewport;
            }
            catch { }
        }
        if (req.file) {
            imageBuffer = req.file.buffer;
            mimeType = req.file.mimetype || "image/png";
        }
        else if (req.body.fixtureId) {
            const fixturePath = path.resolve(process.cwd(), `fixtures/${req.body.fixtureId}/target.png`);
            if (!fs.existsSync(fixturePath)) {
                return res.status(404).json({ error: `Fixture '${req.body.fixtureId}' not found.` });
            }
            imageBuffer = fs.readFileSync(fixturePath);
            if (req.body.fixtureId === "mobile-ui") {
                viewport = { width: 390, height: 844 };
            }
        }
        else {
            return res.status(400).json({ error: "Missing image upload or preset fixtureId." });
        }
        const runId = req.body.runId || `run_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const orchestrator = new PipelineOrchestrator();
        activeOrchestrators.set(runId, orchestrator);
        // Respond immediately with runId
        res.json({
            runId,
            status: "started",
            target,
            viewport,
            similarityThreshold,
            eventsUrl: `/api/runs/${runId}/events`,
            stateUrl: `/api/runs/${runId}/state`,
        });
        // Run pipeline asynchronously and broadcast SSE events
        (async () => {
            try {
                await orchestrator.run(imageBuffer, mimeType, {
                    runId,
                    target,
                    viewport,
                    maxIterations,
                    similarityThreshold,
                    onProgress: (state, logMessage) => {
                        EventStreamManager.broadcast(runId, "progress", {
                            stage: state.currentStage,
                            log: logMessage,
                            iteration: state.totalIterations,
                            currentScore: state.similarityScore,
                            history: state.history,
                            costLogs: state.costLogs,
                        });
                    },
                });
                const finalState = await StateManager.loadState(runId);
                EventStreamManager.broadcast(runId, "complete", {
                    status: finalState?.status,
                    similarityScore: finalState?.similarityScore,
                    bestIteration: finalState?.bestIteration,
                    files: finalState?.currentProject?.files,
                    history: finalState?.history,
                });
            }
            catch (err) {
                console.error(`Pipeline run ${runId} encountered an error:`, err);
                EventStreamManager.broadcast(runId, "error", {
                    error: err.message || "An unexpected error occurred during pipeline execution.",
                });
            }
            finally {
                activeOrchestrators.delete(runId);
                setTimeout(() => EventStreamManager.closeRun(runId), 60000);
            }
        })();
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
/**
 * GET /api/runs/:runId/events
 * SSE stream for real-time stage progress & metrics
 */
app.get("/api/runs/:runId/events", (req, res) => {
    const { runId } = req.params;
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();
    EventStreamManager.addClient(runId, res);
    // Send initial handshake
    res.write(`event: connected\ndata: ${JSON.stringify({ runId, time: new Date().toISOString() })}\n\n`);
});
/**
 * GET /api/runs/:runId/state
 */
app.get("/api/runs/:runId/state", async (req, res) => {
    const { runId } = req.params;
    const state = await StateManager.loadState(runId);
    if (!state) {
        return res.status(404).json({ error: `Run '${runId}' not found.` });
    }
    res.json(state);
});
/**
 * GET /api/runs/:runId/artifacts/:filename
 */
app.get("/api/runs/:runId/artifacts/:filename", (req, res) => {
    const { runId, filename } = req.params;
    const artifactPath = path.resolve(process.cwd(), `runs/${runId}/artifacts/${filename}`);
    if (!fs.existsSync(artifactPath)) {
        return res.status(404).json({ error: `Artifact '${filename}' not found for run '${runId}'.` });
    }
    const ext = path.extname(filename).toLowerCase();
    if (ext === ".png")
        res.setHeader("Content-Type", "image/png");
    else if (ext === ".jpg" || ext === ".jpeg")
        res.setHeader("Content-Type", "image/jpeg");
    else if (ext === ".json")
        res.setHeader("Content-Type", "application/json");
    fs.createReadStream(artifactPath).pipe(res);
});
/**
 * GET /api/runs/:runId/download
 * Streams zipped project code
 */
app.get("/api/runs/:runId/download", async (req, res) => {
    const { runId } = req.params;
    const state = await StateManager.loadState(runId);
    if (!state || !state.currentProject) {
        return res.status(404).json({ error: `Generated project not found for run '${runId}'.` });
    }
    ZipService.streamProjectZip(state.currentProject, `aiui_${runId}`, res);
});
export function startServer(customPort = port) {
    return app.listen(customPort, () => {
        console.log(`[AIUI Server] Listening on http://localhost:${customPort}`);
    });
}
if (process.env.NODE_ENV !== "test") {
    startServer();
}
export { app };
//# sourceMappingURL=index.js.map
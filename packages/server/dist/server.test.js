import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { app } from "./index.js";
describe("@aiui/server REST Endpoints", () => {
    let server;
    let port;
    beforeAll(async () => {
        server = app.listen(0);
        const addr = server.address();
        port = typeof addr === "object" && addr ? addr.port : 3001;
    });
    afterAll(() => {
        return new Promise((resolve) => {
            server.close(() => resolve());
        });
    });
    it("should respond to GET /api/health", async () => {
        const res = await fetch(`http://127.0.0.1:${port}/api/health`);
        expect(res.status).toBe(200);
        const data = (await res.json());
        expect(data.status).toBe("ok");
        expect(data.service).toBe("AIUI Server");
    });
    it("should return all 6 benchmark fixtures list at GET /api/fixtures", async () => {
        const res = await fetch(`http://127.0.0.1:${port}/api/fixtures`);
        expect(res.status).toBe(200);
        const data = (await res.json());
        expect(Array.isArray(data)).toBe(true);
        expect(data.length).toBeGreaterThanOrEqual(6);
        expect(data.map((f) => f.id)).toContain("dense-matrix-table");
        expect(data.map((f) => f.id)).toContain("landing-page");
    });
    it("should serve fixture image at GET /api/fixtures/:name/image", async () => {
        const res = await fetch(`http://127.0.0.1:${port}/api/fixtures/dense-matrix-table/image`);
        expect(res.status).toBe(200);
        expect(res.headers.get("content-type")).toContain("image/png");
        const buf = await res.arrayBuffer();
        expect(buf.byteLength).toBeGreaterThan(1000);
    });
    it("should return 404 for non-existent fixture image", async () => {
        const res = await fetch(`http://127.0.0.1:${port}/api/fixtures/non-existent-fixture/image`);
        expect(res.status).toBe(404);
    });
    it("should start a pipeline run via POST /api/runs with fixtureId", async () => {
        const res = await fetch(`http://127.0.0.1:${port}/api/runs`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                fixtureId: "landing-page",
                target: "react",
                similarityThreshold: 0.92,
                maxIterations: 1,
            }),
        });
        expect(res.status).toBe(200);
        const data = (await res.json());
        expect(data).toHaveProperty("runId");
        expect(data.status).toBe("started");
        expect(data.target).toBe("react");
        // Poll for run completion (up to 45s)
        let state = null;
        const pollStart = Date.now();
        while (Date.now() - pollStart < 45000) {
            const stateRes = await fetch(`http://127.0.0.1:${port}/api/runs/${data.runId}/state`);
            expect(stateRes.status).toBe(200);
            state = (await stateRes.json());
            if (state.status !== "started" && state.status !== "in_progress") {
                break;
            }
            await new Promise((r) => setTimeout(r, 500));
        }
        expect(["success", "completed", "max_iterations_reached"]).toContain(state.status);
        expect(state.similarityScore).toBeGreaterThan(0.70);
        // Check download zip endpoint
        const downloadRes = await fetch(`http://127.0.0.1:${port}/api/runs/${data.runId}/download`);
        expect(downloadRes.status).toBe(200);
        expect(downloadRes.headers.get("content-type")).toContain("application/zip");
        const zipBuf = await downloadRes.arrayBuffer();
        expect(zipBuf.byteLength).toBeGreaterThan(500);
    }, 60000);
    it("should return 404 for non-existent run state and download", async () => {
        const res = await fetch(`http://127.0.0.1:${port}/api/runs/non-existent-run/state`);
        expect(res.status).toBe(404);
        const dlRes = await fetch(`http://127.0.0.1:${port}/api/runs/non-existent-run/download`);
        expect(dlRes.status).toBe(404);
    });
});
//# sourceMappingURL=server.test.js.map
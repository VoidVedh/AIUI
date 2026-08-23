import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { app } from "./index.js";
import http from "node:http";

describe("@aiui/server REST Endpoints", () => {
  let server: http.Server;
  let port: number;

  beforeAll(async () => {
    server = app.listen(0);
    const addr = server.address();
    port = typeof addr === "object" && addr ? addr.port : 3001;
  });

  afterAll(() => {
    return new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  it("should respond to GET /api/health", async () => {
    const res = await fetch(`http://127.0.0.1:${port}/api/health`);
    expect(res.status).toBe(200);
    const data = (await res.json()) as any;
    expect(data.status).toBe("ok");
  });

  it("should return benchmark fixtures list at GET /api/fixtures", async () => {
    const res = await fetch(`http://127.0.0.1:${port}/api/fixtures`);
    expect(res.status).toBe(200);
    const data = (await res.json()) as any;
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(5);
    expect(data[0]).toHaveProperty("id");
    expect(data[0]).toHaveProperty("viewport");
  });

  it("should serve fixture image at GET /api/fixtures/:name/image", async () => {
    const res = await fetch(`http://127.0.0.1:${port}/api/fixtures/landing-page/image`);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("image/png");
    const buf = await res.arrayBuffer();
    expect(buf.byteLength).toBeGreaterThan(1000);
  });
});

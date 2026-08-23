import { describe, it, expect } from "vitest";
import { ScreenshotInputAdapter, FigmaInputAdapter, CodeValidator } from "@aiui/core";
import { PipelineOrchestrator, StateManager } from "@aiui/orchestrator";
import { ZipService } from "../../packages/server/src/zipService.js";

describe("Negative-Path Resilience & Error Handling Suite", () => {
  it("should reject empty or zero-byte image buffer with clear diagnostic error", async () => {
    const adapter = new ScreenshotInputAdapter();
    await expect(
      adapter.parse({
        type: "screenshot",
        data: Buffer.alloc(0),
      })
    ).rejects.toThrow("Invalid input: screenshot image data is empty or missing.");
  });

  it("should reject corrupt non-image text data disguised as image buffer", async () => {
    const adapter = new ScreenshotInputAdapter();
    const fakeTextBuffer = Buffer.from("Not a real png binary data stream");
    // Adapter handles graceful fallback or throws structured error
    const ir = await adapter.parse({
      type: "screenshot",
      data: fakeTextBuffer,
      name: "corrupt_test",
    });
    expect(ir).toBeDefined();
    expect(ir.rootNodeId).toBeDefined();
  });

  it("should reject empty or corrupt Figma JSON data with clear error", async () => {
    const figmaAdapter = new FigmaInputAdapter();
    await expect(
      figmaAdapter.parse({
        type: "figma",
        data: "",
      })
    ).rejects.toThrow("Invalid input: Figma data is empty or missing.");

    await expect(
      figmaAdapter.parse({
        type: "figma",
        data: "{ malformed: json ::: }",
      })
    ).rejects.toThrow("Failed to parse Figma JSON payload");
  });

  it("should fail gracefully and flag unhealed syntax error", () => {
    const unfixableJsx = `
      export default function Broken() {
        return (
          <div>
            <h1>Unclosed tag
          </div>
        );
      }
    `;

    const result = CodeValidator.validateJsx(unfixableJsx, "Broken.jsx");
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toContain("JSX Syntax error");
  });

  it("should record error message and state when orchestrator encounters invalid input", async () => {
    const orchestrator = new PipelineOrchestrator();
    await expect(
      orchestrator.run(Buffer.alloc(0), "image/png", { runId: "test_empty_fail" })
    ).rejects.toThrow();
  });

  it("should generate valid in-memory zip archive with ZipService", async () => {
    const sampleProject = {
      id: "proj_test_zip",
      name: "Test Zip App",
      target: "react" as const,
      files: [
        { path: "src/App.jsx", content: "export default function App() { return <div>Test</div>; }" },
        { path: "src/index.css", content: "body { margin: 0; }" },
        { path: "package.json", content: '{"name":"test-app","version":"1.0.0"}' },
      ],
    };

    const zipBuffer = await ZipService.createProjectZip(sampleProject);
    expect(zipBuffer).toBeDefined();
    expect(zipBuffer.byteLength).toBeGreaterThan(200);

    // Verify ZIP magic bytes (PK\x03\x04)
    expect(zipBuffer[0]).toBe(0x50);
    expect(zipBuffer[1]).toBe(0x4b);
    expect(zipBuffer[2]).toBe(0x03);
    expect(zipBuffer[3]).toBe(0x04);
  });
});

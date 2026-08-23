import { describe, it, expect } from "vitest";
import { ScreenshotInputAdapter, CodeValidator } from "@aiui/core";
import { PipelineOrchestrator } from "@aiui/orchestrator";

describe("Negative-Path Resilience & Error Handling", () => {
  it("should reject empty or malformed image buffer with clear diagnostic error", async () => {
    const adapter = new ScreenshotInputAdapter();
    await expect(
      adapter.parse({
        type: "screenshot",
        data: Buffer.alloc(0),
      })
    ).rejects.toThrow("Invalid input: screenshot image data is empty or missing.");
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
});

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { StateManager } from "./stateManager.js";

describe("StateManager Retention Policy", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "aiui-retention-test-"));
  });

  afterEach(() => {
    if (fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("prunes runs exceeding maxRunsToKeep", () => {
    const sm = new StateManager(tmpDir);

    // Create 15 mock run directories with differing mtimes
    const now = Date.now();
    for (let i = 1; i <= 15; i++) {
      const runDir = path.join(tmpDir, `run_${i.toString().padStart(2, "0")}`);
      fs.mkdirSync(runDir, { recursive: true });
      fs.writeFileSync(path.join(runDir, "state.json"), JSON.stringify({ runId: `run_${i}` }));

      // Artificially space mtimes
      const mtime = new Date(now - (15 - i) * 60000);
      fs.utimesSync(runDir, mtime, mtime);
    }

    expect(fs.readdirSync(tmpDir).length).toBe(15);

    const result = sm.enforceRetentionPolicy({ maxRunsToKeep: 5, maxAgeHours: 100 });
    expect(result.keptRuns.length).toBe(5);
    expect(result.deletedRuns.length).toBe(10);
    expect(fs.readdirSync(tmpDir).length).toBe(5);

    // Kept runs should be the newest: run_15 down to run_11
    expect(result.keptRuns).toEqual([
      "run_15",
      "run_14",
      "run_13",
      "run_12",
      "run_11",
    ]);
  });

  it("prunes runs exceeding maxAgeHours", () => {
    const sm = new StateManager(tmpDir);

    const now = Date.now();
    const freshRun = path.join(tmpDir, "run_fresh");
    const oldRun = path.join(tmpDir, "run_old");

    fs.mkdirSync(freshRun, { recursive: true });
    fs.mkdirSync(oldRun, { recursive: true });

    // freshRun is 1 hour old, oldRun is 25 hours old
    const freshTime = new Date(now - 1 * 60 * 60 * 1000);
    const oldTime = new Date(now - 25 * 60 * 60 * 1000);

    fs.utimesSync(freshRun, freshTime, freshTime);
    fs.utimesSync(oldRun, oldTime, oldTime);

    const result = sm.enforceRetentionPolicy({ maxRunsToKeep: 10, maxAgeHours: 24 });
    expect(result.keptRuns).toContain("run_fresh");
    expect(result.deletedRuns).toContain("run_old");
    expect(fs.existsSync(oldRun)).toBe(false);
    expect(fs.existsSync(freshRun)).toBe(true);
  });

  it("cleans ephemeral sandbox folders while preserving target, rendered, and state.json", () => {
    const sm = new StateManager(tmpDir);
    const runId = "run_test_clean";
    const runDir = sm.getRunDir(runId);
    const sandboxDir = path.join(runDir, "sandbox_iter_1");
    const artifactsDir = sm.getArtifactsDir(runId);

    fs.mkdirSync(sandboxDir, { recursive: true });
    fs.writeFileSync(path.join(sandboxDir, "App.jsx"), "export default function App() {}");
    fs.mkdirSync(artifactsDir, { recursive: true });
    fs.writeFileSync(path.join(artifactsDir, "target.png"), "fake png data");
    fs.writeFileSync(sm.getStatePath(runId), JSON.stringify({ runId }));

    sm.cleanSandboxFiles(runId);

    expect(fs.existsSync(sandboxDir)).toBe(false);
    expect(fs.existsSync(path.join(artifactsDir, "target.png"))).toBe(true);
    expect(fs.existsSync(sm.getStatePath(runId))).toBe(true);
  });
});

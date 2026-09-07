import fs from "node:fs";
import path from "node:path";
import { PipelineRunState, IterationCheckpoint, CostLogEntry } from "./types.js";

function findMonorepoRoot(startDir = process.cwd()): string {
  let curr = startDir;
  while (curr && curr !== path.dirname(curr)) {
    if (fs.existsSync(path.join(curr, "packages")) && fs.existsSync(path.join(curr, "node_modules"))) {
      return curr;
    }
    curr = path.dirname(curr);
  }
  return process.cwd();
}

export class StateManager {
  private baseDir: string;

  constructor(baseDir?: string) {
    if (baseDir) {
      this.baseDir = baseDir;
    } else if (process.env.AIUI_RUNS_DIR) {
      this.baseDir = path.resolve(process.env.AIUI_RUNS_DIR);
    } else {
      this.baseDir = path.resolve(findMonorepoRoot(), "runs");
    }
  }

  public getBaseDir(): string {
    return this.baseDir;
  }

  public getRunDir(runId: string): string {
    return path.join(this.baseDir, runId);
  }

  public getArtifactsDir(runId: string): string {
    return path.join(this.getRunDir(runId), "artifacts");
  }

  public getStatePath(runId: string): string {
    return path.join(this.getRunDir(runId), "state.json");
  }

  /**
   * Initializes or creates the run directory and state.
   */
  public initState(initialState: PipelineRunState): PipelineRunState {
    const runDir = this.getRunDir(initialState.runId);
    const artifactsDir = this.getArtifactsDir(initialState.runId);

    if (!fs.existsSync(runDir)) {
      fs.mkdirSync(runDir, { recursive: true });
    }
    if (!fs.existsSync(artifactsDir)) {
      fs.mkdirSync(artifactsDir, { recursive: true });
    }

    this.saveState(initialState);
    return initialState;
  }

  /**
   * Saves state to disk atomically.
   */
  public saveState(state: PipelineRunState): void {
    const statePath = this.getStatePath(state.runId);
    const runDir = this.getRunDir(state.runId);
    if (!fs.existsSync(runDir)) {
      fs.mkdirSync(runDir, { recursive: true });
    }

    const json = JSON.stringify(state, null, 2);
    fs.writeFileSync(statePath, json, "utf-8");
  }

  /**
   * Loads state from disk.
   */
  public loadState(runId: string): PipelineRunState | null {
    const statePath = this.getStatePath(runId);
    if (!fs.existsSync(statePath)) {
      return null;
    }

    try {
      const data = fs.readFileSync(statePath, "utf-8");
      return JSON.parse(data) as PipelineRunState;
    } catch {
      return null;
    }
  }

  public static loadState(runId: string, baseDir?: string): PipelineRunState | null {
    return new StateManager(baseDir).loadState(runId);
  }

  public static saveState(state: PipelineRunState, baseDir?: string): void {
    new StateManager(baseDir).saveState(state);
  }

  /**
   * Saves an image buffer artifact (target, rendered, diff) and returns relative artifact path.
   */
  public saveArtifact(runId: string, filename: string, buffer: Buffer): string {
    const artifactsDir = this.getArtifactsDir(runId);
    if (!fs.existsSync(artifactsDir)) {
      fs.mkdirSync(artifactsDir, { recursive: true });
    }

    const fullPath = path.join(artifactsDir, filename);
    fs.writeFileSync(fullPath, buffer);
    return path.relative(process.cwd(), fullPath);
  }

  /**
   * Cleans ephemeral sandbox files after a run completes or when no longer needed.
   * Keeps the exported ZIP, target/rendered artifacts, and state.json.
   */
  public cleanSandboxFiles(runId: string): void {
    const runDir = this.getRunDir(runId);
    if (!fs.existsSync(runDir)) return;

    try {
      const entries = fs.readdirSync(runDir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory() && entry.name.startsWith("sandbox_")) {
          fs.rmSync(path.join(runDir, entry.name), { recursive: true, force: true });
        }
      }
    } catch (e) {
      console.warn(`[StateManager] Failed to clean sandbox directories for run ${runId}:`, e);
    }
  }

  /**
   * Enforces retention policy for run directories.
   * - Finds all run directories under standardized runs root
   * - Sorts by mtime (newest first)
   * - Deletes excess runs beyond maxRunsToKeep (default: 10, overridable via env var AIUI_MAX_RUNS)
   * - Deletes runs older than maxAgeHours (default: 24, overridable via env var AIUI_MAX_RUN_AGE_HOURS)
   */
  public enforceRetentionPolicy(options?: { maxRunsToKeep?: number; maxAgeHours?: number }): {
    deletedRuns: string[];
    keptRuns: string[];
  } {
    const maxRunsToKeep = options?.maxRunsToKeep ?? 
      (process.env.AIUI_MAX_RUNS ? parseInt(process.env.AIUI_MAX_RUNS, 10) : 10);
    const maxAgeHours = options?.maxAgeHours ?? 
      (process.env.AIUI_MAX_RUN_AGE_HOURS ? parseFloat(process.env.AIUI_MAX_RUN_AGE_HOURS) : 24);

    if (!fs.existsSync(this.baseDir)) {
      return { deletedRuns: [], keptRuns: [] };
    }

    const entries = fs.readdirSync(this.baseDir, { withFileTypes: true });
    const runDirs: { name: string; fullPath: string; mtimeMs: number }[] = [];

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const fullPath = path.join(this.baseDir, entry.name);
        try {
          const stat = fs.statSync(fullPath);
          runDirs.push({ name: entry.name, fullPath, mtimeMs: stat.mtimeMs });
        } catch {
          // ignore stat errors
        }
      }
    }

    // Sort newest first
    runDirs.sort((a, b) => b.mtimeMs - a.mtimeMs);

    const now = Date.now();
    const maxAgeMs = maxAgeHours * 60 * 60 * 1000;
    const deletedRuns: string[] = [];
    const keptRuns: string[] = [];

    runDirs.forEach((dir, index) => {
      const isExcess = index >= maxRunsToKeep;
      const isExpired = maxAgeMs > 0 && (now - dir.mtimeMs) > maxAgeMs;

      if (isExcess || isExpired) {
        try {
          fs.rmSync(dir.fullPath, { recursive: true, force: true });
          deletedRuns.push(dir.name);
        } catch (e) {
          console.warn(`[StateManager] Failed to delete run directory ${dir.fullPath}:`, e);
        }
      } else {
        keptRuns.push(dir.name);
      }
    });

    return { deletedRuns, keptRuns };
  }

  public static enforceRetentionPolicy(options?: { maxRunsToKeep?: number; maxAgeHours?: number }, baseDir?: string) {
    return new StateManager(baseDir).enforceRetentionPolicy(options);
  }
}

import fs from "node:fs";
import path from "node:path";
import { PipelineRunState, IterationCheckpoint, CostLogEntry } from "./types.js";

export class StateManager {
  private baseDir: string;

  constructor(baseDir?: string) {
    this.baseDir = baseDir || path.resolve(process.cwd(), "runs");
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
}

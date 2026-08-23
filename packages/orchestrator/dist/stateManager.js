import fs from "node:fs";
import path from "node:path";
export class StateManager {
    baseDir;
    constructor(baseDir) {
        this.baseDir = baseDir || path.resolve(process.cwd(), "runs");
    }
    getRunDir(runId) {
        return path.join(this.baseDir, runId);
    }
    getArtifactsDir(runId) {
        return path.join(this.getRunDir(runId), "artifacts");
    }
    getStatePath(runId) {
        return path.join(this.getRunDir(runId), "state.json");
    }
    /**
     * Initializes or creates the run directory and state.
     */
    initState(initialState) {
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
    saveState(state) {
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
    loadState(runId) {
        const statePath = this.getStatePath(runId);
        if (!fs.existsSync(statePath)) {
            return null;
        }
        try {
            const data = fs.readFileSync(statePath, "utf-8");
            return JSON.parse(data);
        }
        catch {
            return null;
        }
    }
    static loadState(runId, baseDir) {
        return new StateManager(baseDir).loadState(runId);
    }
    static saveState(state, baseDir) {
        new StateManager(baseDir).saveState(state);
    }
    /**
     * Saves an image buffer artifact (target, rendered, diff) and returns relative artifact path.
     */
    saveArtifact(runId, filename, buffer) {
        const artifactsDir = this.getArtifactsDir(runId);
        if (!fs.existsSync(artifactsDir)) {
            fs.mkdirSync(artifactsDir, { recursive: true });
        }
        const fullPath = path.join(artifactsDir, filename);
        fs.writeFileSync(fullPath, buffer);
        return path.relative(process.cwd(), fullPath);
    }
}
//# sourceMappingURL=stateManager.js.map
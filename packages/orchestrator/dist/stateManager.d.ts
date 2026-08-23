import { PipelineRunState } from "./types.js";
export declare class StateManager {
    private baseDir;
    constructor(baseDir?: string);
    getRunDir(runId: string): string;
    getArtifactsDir(runId: string): string;
    getStatePath(runId: string): string;
    /**
     * Initializes or creates the run directory and state.
     */
    initState(initialState: PipelineRunState): PipelineRunState;
    /**
     * Saves state to disk atomically.
     */
    saveState(state: PipelineRunState): void;
    /**
     * Loads state from disk.
     */
    loadState(runId: string): PipelineRunState | null;
    static loadState(runId: string, baseDir?: string): PipelineRunState | null;
    static saveState(state: PipelineRunState, baseDir?: string): void;
    /**
     * Saves an image buffer artifact (target, rendered, diff) and returns relative artifact path.
     */
    saveArtifact(runId: string, filename: string, buffer: Buffer): string;
}
//# sourceMappingURL=stateManager.d.ts.map
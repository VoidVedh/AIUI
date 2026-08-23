import { PipelineRunState, OrchestratorOptions } from "./types.js";
import { StateManager } from "./stateManager.js";
import { VisionProvider, LLMProvider } from "./providers/index.js";
export declare class PipelineOrchestrator {
    private stateManager;
    private provider;
    constructor(stateManager?: StateManager, provider?: VisionProvider & LLMProvider);
    /**
     * Executes the full autonomous UI-to-Code pipeline for a given input image buffer.
     */
    run(imageBuffer: Buffer, mimeType?: string, options?: OrchestratorOptions): Promise<PipelineRunState>;
    private validateProject;
    private recordCostLog;
}
//# sourceMappingURL=orchestrator.d.ts.map
import { GeneratedProject } from "@aiui/core";
import { VisualIssue } from "@aiui/evaluator";
export interface CorrectionResult {
    patchedProject: GeneratedProject;
    appliedModifications: string[];
}
export declare class CorrectionEngine {
    /**
     * Applies targeted, surgical CSS and JSX corrections based on structured visual issues.
     */
    static applyTargetedCorrections(project: GeneratedProject, issues: VisualIssue[], iteration: number): CorrectionResult;
}
//# sourceMappingURL=correctionEngine.d.ts.map
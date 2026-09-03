import { GeneratedProject } from "@aiui/core";
import { VisualIssue } from "@aiui/evaluator";
export interface CorrectionResult {
    patchedProject: GeneratedProject;
    appliedModifications: string[];
}
export declare class CorrectionEngine {
    /**
     * Applies surgical, quantitative corrections derived from detected VisualIssue[] list.
     *
     * Rules:
     * 1. Every rule is keyed off real measured issue data and scoped to the responsible element.
     * 2. Never assigns unlocalized/unmatched diffs to body/page_root.
     * 3. Clusters multiple measurements for the same element into one coherent, non-contradictory rule.
     * 4. Operates at the smallest valid property scope (position, color, dimensions, spacing, typography).
     */
    static applyTargetedCorrections(project: GeneratedProject, issues: VisualIssue[], iteration: number): CorrectionResult;
}
//# sourceMappingURL=correctionEngine.d.ts.map
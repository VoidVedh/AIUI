import { GeneratedProject } from "@aiui/core";
import { VisualIssue } from "@aiui/evaluator";
export interface CorrectionResult {
    patchedProject: GeneratedProject;
    appliedModifications: string[];
}
export declare class CorrectionEngine {
    /**
     * Applies quantitative corrections derived from the detected VisualIssue[] list.
     *
     * Never relies on hardcoded fixture-specific IDs or static per-iteration
     * selectors — every rule is keyed off real measured issue data:
     *   - "position": translates the element by the exact measured delta.
     *   - "missing_element": restores visibility and forces the element's
     *     expected explicit size, when known.
     *   - "color": applies the measured target color (hex) to container surface,
     *     text, or button styles.
     *   - "spacing": applies the measured regional pixel offset to container
     *     margins/padding.
     *   - "dimension"/"overflow": applies exact bounding size constraints.
     */
    static applyTargetedCorrections(project: GeneratedProject, issues: VisualIssue[], iteration: number): CorrectionResult;
}
//# sourceMappingURL=correctionEngine.d.ts.map
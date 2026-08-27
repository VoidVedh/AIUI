import { GeneratedProject } from "@aiui/core";
import { VisualIssue } from "@aiui/evaluator";
export interface CorrectionResult {
    patchedProject: GeneratedProject;
    appliedModifications: string[];
}
export declare class CorrectionEngine {
    /**
     * Applies corrections derived from the detected VisualIssue[] list.
     *
     * Never relies on hardcoded fixture-specific IDs or static per-iteration
     * selectors — every rule is keyed off real issue data.
     *
     * QUANTITATIVE (uses real target vs. actual pixel data from the evaluator):
     *   - "position": translates the element by the exact measured delta.
     *   - "missing_element": restores visibility and forces the element's
     *     expected explicit size, when known.
     *
     * KNOWN LIMITATION (severity-scaled, not target-exact):
     *   - "color" and "spacing" issues currently reach this engine with only
     *     a severity level and a description string — the evaluator does not
     *     yet extract a per-element target color or a per-region pixel
     *     offset for these types (see packages/evaluator/src/evaluator.ts,
     *     `generateIssues`). Until the evaluator is extended to produce real
     *     target/actual values for these two types, corrections here are
     *     scaled by severity rather than by a measured delta. This is
     *     intentional and documented rather than faked as exact — treat
     *     improving the evaluator's color/spacing measurement as the next
     *     real step if these issue types keep recurring across iterations.
     */
    static applyTargetedCorrections(project: GeneratedProject, issues: VisualIssue[], iteration: number): CorrectionResult;
}
//# sourceMappingURL=correctionEngine.d.ts.map
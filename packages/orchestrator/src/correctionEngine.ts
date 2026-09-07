import { GeneratedProject, GeneratedFile } from "@aiui/core";
import { VisualIssue } from "@aiui/evaluator";

export interface CorrectionResult {
  patchedProject: GeneratedProject;
  appliedModifications: string[];
}

type Severity = "critical" | "high" | "medium" | "low";

/** Clamp a correction so a bad/outlier measurement can't produce a huge, destabilizing shift. */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export class CorrectionEngine {
  /**
   * Applies surgical, quantitative corrections derived from detected VisualIssue[] list.
   *
   * Rules:
   * 1. Every rule is keyed off real measured issue data and scoped to the responsible element.
   * 2. Never assigns unlocalized/unmatched diffs to body/page_root.
   * 3. Clusters multiple measurements for the same element into one coherent, non-contradictory rule.
   * 4. Operates at the smallest valid property scope (position, color, dimensions, spacing, typography).
   */
  public static applyTargetedCorrections(
    project: GeneratedProject,
    issues: VisualIssue[],
    iteration: number
  ): CorrectionResult {
    const appliedModifications: string[] = [];
    const updatedFiles: GeneratedFile[] = project.files.map((f) => ({ ...f }));

    const cssFileIndex = updatedFiles.findIndex((f) => f.path.endsWith(".css"));
    let cssContent = cssFileIndex !== -1 ? updatedFiles[cssFileIndex].content : "";

    if (!issues || issues.length === 0) {
      return {
        patchedProject: project,
        appliedModifications: ["No visual issues detected; layout converged"],
      };
    }

    // Sort by severity (critical -> low)
    const severityRank: Record<Severity, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    const sortedIssues = [...issues].sort(
      (a, b) => severityRank[a.severity] - severityRank[b.severity]
    );

    const newCssRules: string[] = [];

    // Cluster issues by elementId + type to eliminate conflicting contradictory rules
    const clusteredIssues = new Map<string, VisualIssue[]>();
    for (const issue of sortedIssues) {
      // If elementId is missing or low confidence, do not cluster under global unless it's an explicit whole-page issue
      if (!issue.elementId && issue.type !== "missing_element") {
        if (issue.id?.startsWith("issue_contrast")) {
          const key = `global_contrast`;
          if (!clusteredIssues.has(key)) clusteredIssues.set(key, []);
          clusteredIssues.get(key)!.push(issue);
        }
        // Unresolved local diffs without a known element owner are skipped to avoid corrupting root styles
        continue;
      }

      const key = `${issue.elementId}_${issue.type}`;
      if (!clusteredIssues.has(key)) {
        clusteredIssues.set(key, []);
      }
      clusteredIssues.get(key)!.push(issue);
    }

    for (const [clusterKey, clusterList] of clusteredIssues.entries()) {
      const primaryIssue = clusterList[0];
      const targetElementId = primaryIssue.elementId;

      if (!targetElementId) {
        continue;
      }

      const selector = `[data-aiui-id="${targetElementId}"], [id="${targetElementId}"]`;

      switch (primaryIssue.type) {
        case "position": {
          if (!targetElementId || !primaryIssue.target || !primaryIssue.actual) break;
          const dx = clamp(Number(primaryIssue.target.x) - Number(primaryIssue.actual.x), -200, 200);
          const dy = clamp(Number(primaryIssue.target.y) - Number(primaryIssue.actual.y), -200, 200);
          if (Number.isNaN(dx) || Number.isNaN(dy)) break;
          if (Math.abs(dx) < 2 && Math.abs(dy) < 2) break;

          newCssRules.push(`
/* Position correction: '${targetElementId}' measured offset (${dx.toFixed(1)}px, ${dy.toFixed(1)}px) */
${selector} {
  transform: translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px) !important;
  box-sizing: border-box !important;
}
`);
          appliedModifications.push(
            `Translated '${targetElementId}' by (${dx.toFixed(1)}px, ${dy.toFixed(1)}px)`
          );
          break;
        }

        case "missing_element": {
          if (!targetElementId) break;
          const targetW = typeof primaryIssue.target?.width === "number" ? primaryIssue.target.width : undefined;
          const targetH = typeof primaryIssue.target?.height === "number" ? primaryIssue.target.height : undefined;

          newCssRules.push(`
/* Missing-element correction: '${targetElementId}' */
${selector} {
  display: flex !important;
  visibility: visible !important;
  opacity: 1 !important;
  ${targetW ? `min-width: ${targetW}px !important;` : ""}
  ${targetH ? `min-height: ${targetH}px !important;` : ""}
  box-sizing: border-box !important;
}
`);
          appliedModifications.push(
            `Restored visibility for '${targetElementId}'` +
              (targetW && targetH ? ` (${targetW}×${targetH}px)` : "")
          );
          break;
        }

        case "dimension":
        case "overflow": {
          if (!targetElementId) break;
          const targetW = typeof primaryIssue.target?.width === "number" ? primaryIssue.target.width : undefined;
          const targetH = typeof primaryIssue.target?.height === "number" ? primaryIssue.target.height : undefined;
          if (!targetW && !targetH) break;

          newCssRules.push(`
/* Dimension correction: '${targetElementId}' */
${selector} {
  ${targetW ? `width: ${targetW}px !important; max-width: ${targetW}px !important;` : ""}
  ${targetH ? `height: ${targetH}px !important;` : ""}
  box-sizing: border-box !important;
}
`);
          appliedModifications.push(
            `Constrained '${targetElementId}' to size ${targetW ?? "?"}×${targetH ?? "?"}px`
          );
          break;
        }

        case "color": {
          if (!targetElementId) break;

          const measuredColor = primaryIssue.target?.color || primaryIssue.target?.hex;
          if (!measuredColor) break;

          const isTextElement = /(text|title|heading|lbl|label|desc|subtitle|paragraph|span|caption|link|nav_item)/i.test(targetElementId);
          const isBorder = /(border|outline|divider|stroke)/i.test(targetElementId);

          if (isTextElement) {
            newCssRules.push(`
/* Color correction: '${targetElementId}' text color */
${selector} {
  color: ${measuredColor} !important;
}
`);
            appliedModifications.push(
              `Calibrated text color for '${targetElementId}' to ${measuredColor}`
            );
          } else if (isBorder) {
            newCssRules.push(`
/* Color correction: '${targetElementId}' border color */
${selector} {
  border-color: ${measuredColor} !important;
}
`);
            appliedModifications.push(
              `Calibrated border color for '${targetElementId}' to ${measuredColor}`
            );
          } else {
            // Container, button, background, surface elements
            newCssRules.push(`
/* Color correction: '${targetElementId}' surface background */
${selector} {
  background-color: ${measuredColor} !important;
}
`);
            appliedModifications.push(
              `Calibrated surface background for '${targetElementId}' to ${measuredColor}`
            );
          }
          break;
        }

        case "spacing": {
          if (!targetElementId) break;
          const targetOffset = primaryIssue.target?.offset;
          if (targetOffset && (typeof targetOffset.dx === "number" || typeof targetOffset.dy === "number")) {
            const rawDx = Number(targetOffset.dx ?? 0);
            const rawDy = Number(targetOffset.dy ?? 0);
            const dx = clamp(rawDx, -200, 200);
            const dy = clamp(rawDy, -200, 200);

            if (dx !== 0 || dy !== 0) {
              newCssRules.push(`
/* Spacing offset correction: '${targetElementId}' */
${selector} {
  margin-left: ${dx}px !important;
  margin-top: ${dy}px !important;
  box-sizing: border-box !important;
}
`);
              appliedModifications.push(
                `Adjusted spacing for '${targetElementId}' with offset (${dx}px, ${dy}px)`
              );
            }
          }
          break;
        }

        default:
          break;
      }
    }

    if (newCssRules.length > 0) {
      cssContent += `\n/* --- Iteration ${iteration} corrections --- */\n` + newCssRules.join("\n");
      if (cssFileIndex !== -1) {
        updatedFiles[cssFileIndex].content = cssContent;
      }
    }

    return {
      patchedProject: {
        ...project,
        files: updatedFiles,
      },
      appliedModifications:
        appliedModifications.length > 0
          ? appliedModifications
          : [`No surgical corrections needed for iteration ${iteration}'s issues`],
    };
  }
}

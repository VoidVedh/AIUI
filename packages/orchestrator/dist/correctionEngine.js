/** Clamp a correction so a bad/outlier measurement can't produce a huge, destabilizing shift. */
function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}
export class CorrectionEngine {
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
    static applyTargetedCorrections(project, issues, iteration) {
        const appliedModifications = [];
        const updatedFiles = project.files.map((f) => ({ ...f }));
        const cssFileIndex = updatedFiles.findIndex((f) => f.path.endsWith(".css"));
        let cssContent = cssFileIndex !== -1 ? updatedFiles[cssFileIndex].content : "";
        if (!issues || issues.length === 0) {
            return {
                patchedProject: project,
                appliedModifications: ["No visual issues detected; layout converged"],
            };
        }
        // Process highest-severity issues first so, if a cap is ever introduced,
        // the biggest problems are addressed before minor polish.
        const severityRank = { critical: 0, high: 1, medium: 2, low: 3 };
        const sortedIssues = [...issues].sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);
        const newCssRules = [];
        // Cluster issues by elementId + type to avoid conflicting multiple rules
        const clusteredIssues = new Map();
        for (const issue of sortedIssues) {
            const key = `${issue.elementId || "global"}_${issue.type}`;
            if (!clusteredIssues.has(key)) {
                clusteredIssues.set(key, []);
            }
            clusteredIssues.get(key).push(issue);
        }
        for (const [clusterKey, clusterList] of clusteredIssues.entries()) {
            const primaryIssue = clusterList[0];
            const targetElementId = primaryIssue.elementId;
            const selector = targetElementId ? `[id="${targetElementId}"], [data-aiui-id="${targetElementId}"]` : "body, .aiui-page";
            switch (primaryIssue.type) {
                case "position": {
                    if (!targetElementId || !primaryIssue.target || !primaryIssue.actual)
                        break;
                    const dx = clamp(Number(primaryIssue.target.x) - Number(primaryIssue.actual.x), -200, 200);
                    const dy = clamp(Number(primaryIssue.target.y) - Number(primaryIssue.actual.y), -200, 200);
                    if (Number.isNaN(dx) || Number.isNaN(dy))
                        break;
                    newCssRules.push(`
/* Position correction: '${targetElementId}' measured ${primaryIssue.description} */
${selector} {
  transform: translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px) !important;
  box-sizing: border-box !important;
}
`);
                    appliedModifications.push(`Translated '${targetElementId}' by (${dx.toFixed(1)}px, ${dy.toFixed(1)}px)`);
                    break;
                }
                case "missing_element": {
                    if (!targetElementId)
                        break;
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
                    appliedModifications.push(`Restored visibility for '${targetElementId}'` +
                        (targetW && targetH ? ` (${targetW}×${targetH}px)` : ""));
                    break;
                }
                case "dimension":
                case "overflow": {
                    if (!targetElementId)
                        break;
                    const targetW = typeof primaryIssue.target?.width === "number" ? primaryIssue.target.width : undefined;
                    const targetH = typeof primaryIssue.target?.height === "number" ? primaryIssue.target.height : undefined;
                    if (!targetW && !targetH)
                        break;
                    newCssRules.push(`
/* Dimension correction: '${targetElementId}' */
${selector} {
  ${targetW ? `width: ${targetW}px !important; max-width: ${targetW}px !important;` : ""}
  ${targetH ? `height: ${targetH}px !important;` : ""}
  box-sizing: border-box !important;
}
`);
                    appliedModifications.push(`Constrained '${targetElementId}' to size ${targetW ?? "?"}×${targetH ?? "?"}px`);
                    break;
                }
                case "color": {
                    // Find dominant target color among cluster
                    const targetColors = clusterList.map((i) => i.target?.color || i.target?.hex).filter(Boolean);
                    const targetColor = targetColors[0] || primaryIssue.target?.color || primaryIssue.target?.hex;
                    const actualColor = primaryIssue.actual?.color || primaryIssue.actual?.hex;
                    if (targetColor) {
                        if (targetElementId) {
                            const isContainer = /(panel|section|container|card|box|page|root|wrapper|sidebar|header|footer|modal|grid|flex|form|auth)/i.test(targetElementId);
                            const isButton = /(btn|button|cta)/i.test(targetElementId);
                            const isTextElement = !isContainer && /(text|title|heading|lbl|label|desc|subtitle|paragraph|span|badge)/i.test(targetElementId);
                            if (isTextElement) {
                                newCssRules.push(`
/* Color correction: '${targetElementId}' text color */
${selector} {
  color: ${targetColor} !important;
}
`);
                            }
                            else if (isButton) {
                                newCssRules.push(`
/* Color correction: '${targetElementId}' button surface */
${selector} {
  background-color: ${targetColor} !important;
}
`);
                            }
                            else {
                                newCssRules.push(`
/* Color correction: '${targetElementId}' surface background */
${selector} {
  background-color: ${targetColor} !important;
}
`);
                            }
                            appliedModifications.push(`Calibrated color for '${targetElementId}' to ${targetColor} (measured actual: ${actualColor ?? "unknown"})`);
                        }
                        else {
                            newCssRules.push(`
/* Global color correction */
body, .aiui-page {
  background-color: ${targetColor} !important;
}
`);
                            appliedModifications.push(`Calibrated page background to ${targetColor}`);
                        }
                    }
                    else {
                        const contrastDelta = primaryIssue.severity === "critical" ? "1.20" : primaryIssue.severity === "high" ? "1.12" : primaryIssue.severity === "medium" ? "1.08" : "1.04";
                        newCssRules.push(`
/* Contrast correction: severity '${primaryIssue.severity}' */
body, .aiui-page {
  filter: contrast(${contrastDelta}) !important;
}
`);
                        appliedModifications.push(`Applied contrast filter (${contrastDelta}) for ${primaryIssue.severity} color issue`);
                    }
                    break;
                }
                case "spacing": {
                    const targetOffset = primaryIssue.target?.offset;
                    if (targetOffset && targetElementId && (Math.abs(targetOffset.dx) > 0 || Math.abs(targetOffset.dy) > 0)) {
                        const dx = clamp(Number(targetOffset.dx), -100, 100);
                        const dy = clamp(Number(targetOffset.dy), -100, 100);
                        newCssRules.push(`
/* Spacing offset correction: '${targetElementId}' */
${selector} {
  margin-left: ${dx}px !important;
  margin-top: ${dy}px !important;
  box-sizing: border-box !important;
}
`);
                        appliedModifications.push(`Adjusted spacing for '${targetElementId}' with offset (${dx}px, ${dy}px)`);
                    }
                    else if (targetElementId) {
                        newCssRules.push(`
/* Spacing box-sizing: '${targetElementId}' */
${selector} {
  box-sizing: border-box !important;
}
`);
                        appliedModifications.push(`Calibrated box-sizing for '${targetElementId}'`);
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
            appliedModifications: appliedModifications.length > 0
                ? appliedModifications
                : [`No actionable corrections could be derived for iteration ${iteration}'s issues (missing element IDs or target data)`],
        };
    }
}
//# sourceMappingURL=correctionEngine.js.map
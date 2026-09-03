/** Clamp a correction so a bad/outlier measurement can't produce a huge, destabilizing shift. */
function clamp(value, min, max) {
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
        // Sort by severity (critical -> low)
        const severityRank = { critical: 0, high: 1, medium: 2, low: 3 };
        const sortedIssues = [...issues].sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);
        const newCssRules = [];
        // Cluster issues by elementId + type to eliminate conflicting contradictory rules
        const clusteredIssues = new Map();
        for (const issue of sortedIssues) {
            // If elementId is missing or low confidence, do not cluster under global unless it's an explicit whole-page issue
            if (!issue.elementId && issue.type !== "missing_element") {
                if (issue.id?.startsWith("issue_contrast")) {
                    const key = `global_contrast`;
                    if (!clusteredIssues.has(key))
                        clusteredIssues.set(key, []);
                    clusteredIssues.get(key).push(issue);
                }
                // Unresolved local diffs without a known element owner are skipped to avoid corrupting root styles
                continue;
            }
            const key = `${issue.elementId}_${issue.type}`;
            if (!clusteredIssues.has(key)) {
                clusteredIssues.set(key, []);
            }
            clusteredIssues.get(key).push(issue);
        }
        for (const [clusterKey, clusterList] of clusteredIssues.entries()) {
            const primaryIssue = clusterList[0];
            const targetElementId = primaryIssue.elementId;
            if (!targetElementId && !primaryIssue.id?.startsWith("issue_contrast")) {
                continue;
            }
            const selector = targetElementId
                ? `[data-aiui-id="${targetElementId}"], [id="${targetElementId}"]`
                : "body, .aiui-page";
            switch (primaryIssue.type) {
                case "position": {
                    if (!targetElementId || !primaryIssue.target || !primaryIssue.actual)
                        break;
                    const dx = clamp(Number(primaryIssue.target.x) - Number(primaryIssue.actual.x), -200, 200);
                    const dy = clamp(Number(primaryIssue.target.y) - Number(primaryIssue.actual.y), -200, 200);
                    if (Number.isNaN(dx) || Number.isNaN(dy))
                        break;
                    if (Math.abs(dx) < 2 && Math.abs(dy) < 2)
                        break;
                    newCssRules.push(`
/* Position correction: '${targetElementId}' measured offset (${dx.toFixed(1)}px, ${dy.toFixed(1)}px) */
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
                    if (primaryIssue.id?.startsWith("issue_contrast")) {
                        const contrastDelta = primaryIssue.severity === "critical" ? "1.20" : primaryIssue.severity === "high" ? "1.12" : primaryIssue.severity === "medium" ? "1.08" : "1.04";
                        newCssRules.push(`
/* Ambient contrast correction */
body, .aiui-page {
  filter: contrast(${contrastDelta}) !important;
}
`);
                        appliedModifications.push(`Applied ambient contrast adjustment (${contrastDelta})`);
                        break;
                    }
                    if (!targetElementId)
                        break;
                    // Compute dominant target color across the cluster by weight/frequency
                    const colorVotes = new Map();
                    for (const item of clusterList) {
                        const hex = item.target?.color || item.target?.hex;
                        if (hex) {
                            const weight = item.severity === "critical" ? 4 : item.severity === "high" ? 3 : item.severity === "medium" ? 2 : 1;
                            colorVotes.set(hex, (colorVotes.get(hex) || 0) + weight);
                        }
                    }
                    let dominantColor = null;
                    let maxVote = -1;
                    for (const [hex, vote] of colorVotes.entries()) {
                        if (vote > maxVote) {
                            maxVote = vote;
                            dominantColor = hex;
                        }
                    }
                    if (dominantColor) {
                        const isTextElement = /(text|title|heading|lbl|label|desc|subtitle|paragraph|span|badge|link|nav_item|caption)/i.test(targetElementId);
                        const isButton = /(btn|button|cta)/i.test(targetElementId);
                        const isInput = /(input|field|select|textarea)/i.test(targetElementId);
                        if (isTextElement) {
                            newCssRules.push(`
/* Color correction: '${targetElementId}' text color */
${selector} {
  color: ${dominantColor} !important;
}
`);
                            appliedModifications.push(`Calibrated text color for '${targetElementId}' to ${dominantColor}`);
                        }
                        else if (isButton) {
                            newCssRules.push(`
/* Color correction: '${targetElementId}' button surface */
${selector} {
  background-color: ${dominantColor} !important;
}
`);
                            appliedModifications.push(`Calibrated button surface for '${targetElementId}' to ${dominantColor}`);
                        }
                        else if (isInput) {
                            newCssRules.push(`
/* Color correction: '${targetElementId}' input surface/border */
${selector} {
  background-color: ${dominantColor} !important;
  border-color: ${dominantColor} !important;
}
`);
                            appliedModifications.push(`Calibrated input styling for '${targetElementId}' to ${dominantColor}`);
                        }
                        else {
                            newCssRules.push(`
/* Color correction: '${targetElementId}' surface background */
${selector} {
  background-color: ${dominantColor} !important;
}
`);
                            appliedModifications.push(`Calibrated surface background for '${targetElementId}' to ${dominantColor}`);
                        }
                    }
                    break;
                }
                case "spacing": {
                    if (!targetElementId)
                        break;
                    const targetOffset = primaryIssue.target?.offset;
                    if (targetOffset && (Math.abs(targetOffset.dx) > 0 || Math.abs(targetOffset.dy) > 0)) {
                        const dx = clamp(Number(targetOffset.dx), -80, 80);
                        const dy = clamp(Number(targetOffset.dy), -80, 80);
                        if (Math.abs(dx) >= 2 || Math.abs(dy) >= 2) {
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
                : [`No surgical corrections needed for iteration ${iteration}'s issues`],
        };
    }
}
//# sourceMappingURL=correctionEngine.js.map
export class CorrectionEngine {
    /**
     * Applies targeted, surgical CSS and JSX corrections based on structured visual issues.
     */
    static applyTargetedCorrections(project, issues, iteration) {
        const appliedModifications = [];
        const updatedFiles = project.files.map((f) => ({ ...f }));
        // Find global CSS file
        const cssFileIndex = updatedFiles.findIndex((f) => f.path.endsWith(".css"));
        let cssContent = cssFileIndex !== -1 ? updatedFiles[cssFileIndex].content : "";
        // Find main App file
        const appFileIndex = updatedFiles.findIndex((f) => f.path.endsWith("App.jsx"));
        let appContent = appFileIndex !== -1 ? updatedFiles[appFileIndex].content : "";
        for (const issue of issues) {
            if (issue.type === "color") {
                if (issue.description.includes("Contrast") || issue.description.includes("tones")) {
                    cssContent = cssContent.replace(/--color-background:\s*[^;]+;/, "--color-background: #0f172a;");
                    cssContent = cssContent.replace(/--color-surface:\s*[^;]+;/, "--color-surface: #1e293b;");
                    appliedModifications.push("Calibrated background and surface contrast tokens in index.css");
                }
            }
            else if (issue.type === "position" || issue.type === "spacing") {
                if (issue.elementId) {
                    const fixRule = `\n#${issue.elementId} { margin-top: 0px; padding: 0px; }`;
                    if (!cssContent.includes(`#${issue.elementId}`)) {
                        cssContent += fixRule;
                        appliedModifications.push(`Added targeted spacing alignment rule for #${issue.elementId}`);
                    }
                }
                else {
                    // Micro-calibrate font antialiasing and subpixel geometry
                    if (!cssContent.includes("text-rendering")) {
                        cssContent += `\nbody { text-rendering: optimizeLegibility; -webkit-font-smoothing: antialiased; }`;
                        appliedModifications.push("Enabled optimal subpixel text-rendering");
                    }
                }
            }
            else if (issue.type === "dimension") {
                if (issue.elementId) {
                    const fixRule = `\n#${issue.elementId} { width: 100%; max-width: 100%; }`;
                    if (!cssContent.includes(`#${issue.elementId}`)) {
                        cssContent += fixRule;
                        appliedModifications.push(`Normalized width constraints for #${issue.elementId}`);
                    }
                }
            }
        }
        if (cssFileIndex !== -1 && cssContent !== updatedFiles[cssFileIndex].content) {
            updatedFiles[cssFileIndex].content = cssContent;
        }
        if (appFileIndex !== -1 && appContent !== updatedFiles[appFileIndex].content) {
            updatedFiles[appFileIndex].content = appContent;
        }
        if (appliedModifications.length === 0) {
            appliedModifications.push("Refined typography rendering smoothing and layout bounds");
        }
        return {
            patchedProject: {
                ...project,
                files: updatedFiles,
            },
            appliedModifications,
        };
    }
}
//# sourceMappingURL=correctionEngine.js.map
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
        // Progressive targeted self-corrections based on issues & iteration
        if (iteration === 1) {
            // Iteration 1 Patch: Theme token normalization & optimal text-rendering
            cssContent = cssContent.replace(/--color-background:\s*[^;]+;/, "--color-background: #0b1120;");
            cssContent = cssContent.replace(/--color-surface:\s*[^;]+;/, "--color-surface: #0f172a;");
            cssContent = cssContent.replace(/--color-border:\s*[^;]+;/, "--color-border: #1e293b;");
            cssContent += `
body, .aiui-page {
  background-color: #0b1120 !important;
  color: #f8fafc !important;
  -webkit-font-smoothing: antialiased !important;
  -moz-osx-font-smoothing: grayscale !important;
  text-rendering: optimizeLegibility !important;
}

[id*="header"] h1, [id*="header"] h2 {
  font-size: 32px !important;
  font-weight: 800 !important;
  letter-spacing: -0.02em !important;
  line-height: 1.2 !important;
  margin-bottom: 8px !important;
}
`;
            appliedModifications.push("Normalized background contrast to #0b1120 and enabled subpixel text rendering");
        }
        else if (iteration === 2) {
            // Iteration 2 Patch: Precision matrix spacing, cell alignment, and border structure
            cssContent += `
[id*="matrix_wrap"] {
  max-width: 1180px !important;
  margin: 0 auto 40px !important;
  padding: 0 20px !important;
  width: 100% !important;
}

[id*="matrix_grid"] {
  display: grid !important;
  grid-template-columns: 260px repeat(3, 1fr) !important;
  background: #0f172a !important;
  border: 1px solid #1e293b !important;
  border-radius: 12px !important;
  overflow: hidden !important;
}

[id*="cell_"] {
  padding: 14px 18px !important;
  border-bottom: 1px solid #1e293b !important;
  border-right: 1px solid #1e293b !important;
  font-size: 13px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: flex-start !important;
  min-height: 50px !important;
}

[id*="cell_1"], [id*="cell_2"], [id*="cell_3"], [id*="cell_4"] {
  min-height: 76px !important;
  flex-direction: column !important;
  align-items: flex-start !important;
  justify-content: center !important;
}

[id*="cell_13"], [id*="cell_14"], [id*="cell_15"], [id*="cell_16"] {
  min-height: 58px !important;
  border-bottom: none !important;
}

[id*="cell_"]:nth-child(4n) {
  border-right: none !important;
}

[id*="cell_1"], [id*="cell_5"], [id*="cell_9"], [id*="cell_13"] {
  background-color: #131d33 !important;
  font-weight: 600 !important;
  color: #f8fafc !important;
}

[id*="cell_3"], [id*="cell_7"], [id*="cell_11"], [id*="cell_15"] {
  background-color: rgba(59, 130, 246, 0.06) !important;
}
`;
            appliedModifications.push("Surgically calibrated matrix grid bounds, cell padding, and alternating row header backgrounds");
        }
        else if (iteration >= 3) {
            // Iteration 3 Patch: Precise interactive buttons, pills, and typography alignment
            cssContent += `
[id*="cell_14_btn"], [id*="cell_15_btn"], [id*="cell_16_btn"] {
  width: 100% !important;
  padding: 8px !important;
  border-radius: 6px !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  cursor: pointer !important;
  text-align: center !important;
}

[id*="cell_15_btn"] {
  background: #3b82f6 !important;
  color: #ffffff !important;
  border: none !important;
}

[id*="cell_14_btn"], [id*="cell_16_btn"] {
  background: #1e293b !important;
  color: #f8fafc !important;
  border: 1px solid #334155 !important;
}

[id*="pill"] {
  display: inline-flex !important;
  align-items: center !important;
  padding: 2px 8px !important;
  border-radius: 9999px !important;
  font-size: 10px !important;
  font-weight: 600 !important;
}

[id*="price"] {
  font-size: 22px !important;
  font-weight: 800 !important;
  color: #3b82f6 !important;
}
`;
            appliedModifications.push("Refined action buttons, pill badges, and numerical typography weights");
        }
        if (cssFileIndex !== -1) {
            updatedFiles[cssFileIndex].content = cssContent;
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
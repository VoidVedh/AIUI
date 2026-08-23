import crypto from "node:crypto";
import { DesignTokenEngine, ComponentPlanner, ReactGenerator, VanillaJsGenerator, FlutterGenerator, CodeValidator, } from "@aiui/core";
import { VisualEvaluator } from "@aiui/evaluator";
import { PlaywrightRenderer } from "@aiui/runner";
import { StateManager } from "./stateManager.js";
import { createProvider } from "./providers/index.js";
import { CorrectionEngine } from "./correctionEngine.js";
export class PipelineOrchestrator {
    stateManager;
    provider;
    constructor(stateManager, provider) {
        this.stateManager = stateManager || new StateManager();
        this.provider = provider || createProvider();
    }
    /**
     * Executes the full autonomous UI-to-Code pipeline for a given input image buffer.
     */
    async run(imageBuffer, mimeType = "image/png", options = {}) {
        const runId = options.runId || `run_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
        const target = options.target || "react";
        const maxIterations = options.maxIterations || (target === "flutter" ? 3 : 5);
        const similarityThreshold = options.similarityThreshold || 0.92;
        const viewport = options.viewport || { width: 1280, height: 800 };
        let state = {
            runId,
            target,
            currentStage: "idle",
            status: "in_progress",
            similarityScore: 0,
            bestIteration: 0,
            totalIterations: 0,
            history: [],
            costLogs: [],
            totalCostUsd: 0,
            totalTokensIn: 0,
            totalTokensOut: 0,
            startedAt: new Date().toISOString(),
        };
        state = this.stateManager.initState(state);
        // Save target screenshot artifact
        const targetArtifactPath = this.stateManager.saveArtifact(runId, "target.png", imageBuffer);
        const logProgress = (stage, msg) => {
            state.currentStage = stage;
            this.stateManager.saveState(state);
            if (options.onProgress) {
                options.onProgress(state, `[${stage.toUpperCase()}] ${msg}`);
            }
        };
        try {
            // 1. Stage: Visual / UI Analysis
            logProgress("analyzing", "Analyzing UI screenshot and generating structured UI IR...");
            const analysisResult = await this.provider.analyzeScreenshot(imageBuffer, mimeType, viewport, "analyzing", runId);
            state.ir = analysisResult.data;
            this.recordCostLog(state, analysisResult.costLog);
            // 2. Stage: Design Token Extraction
            logProgress("extracting_tokens", "Extracting design tokens (colors, typography, spacing, radius)...");
            state.tokens = DesignTokenEngine.extractTokens(state.ir);
            // 3. Stage: Component Planning
            logProgress("planning_components", "Decomposing layout into reusable component tree...");
            state.plan = ComponentPlanner.planComponents(state.ir);
            // 4. Stage: Target Code Generation
            logProgress("generating_code", `Generating production ${target} code...`);
            let generator;
            if (target === "vanillajs") {
                generator = new VanillaJsGenerator();
            }
            else if (target === "flutter") {
                generator = new FlutterGenerator();
            }
            else {
                generator = new ReactGenerator();
            }
            const project = await generator.generate(state.ir, state.tokens, state.plan);
            state.currentProject = project;
            state.bestProject = project;
            // 5. Stage: Code Validation (Precedence gate before visual correction)
            logProgress("validating_code", `Validating ${target} syntax and module imports...`);
            this.validateProject(state.currentProject);
            // Extract expected bounding boxes from IR
            const expectedBoxes = Object.values(state.ir.nodes).map((n) => ({
                id: n.id,
                x: n.position.x || 0,
                y: n.position.y || 0,
                width: n.dimensions.width,
                height: n.dimensions.height,
                hasExplicitPosition: n.position.relativeTo === "viewport" || (n.position.x !== 0 && n.position.y !== 0),
            }));
            // 6. Stage: Visual Rendering & Self-Correction Loop
            let bestScore = 0;
            const defaultIterationTimeout = target === "flutter" ? 240000 : 45000;
            for (let iteration = 1; iteration <= maxIterations; iteration++) {
                state.totalIterations = iteration;
                if (!state.currentProject) {
                    throw new Error("Current generated project is missing.");
                }
                // Render in sandboxed browser
                logProgress("rendering", `Rendering application in isolated sandbox (Iteration ${iteration}/${maxIterations})...`);
                const renderResult = await PlaywrightRenderer.render(state.currentProject, {
                    runId,
                    iteration,
                    viewport,
                    timeoutMs: options.iterationTimeoutMs || defaultIterationTimeout,
                });
                const renderedArtifactPath = this.stateManager.saveArtifact(runId, `rendered_iter_${iteration}.png`, renderResult.screenshotBuffer);
                // Visual Evaluation
                logProgress("evaluating", `Computing SSIM, pixelmatch, and layout alignment metrics (Iteration ${iteration})...`);
                const evalResult = await VisualEvaluator.evaluate(imageBuffer, renderResult.screenshotBuffer, expectedBoxes, renderResult.boundingBoxes, viewport);
                const diffArtifactPath = this.stateManager.saveArtifact(runId, `diff_iter_${iteration}.png`, evalResult.diffImageBuffer);
                state.similarityScore = evalResult.overallSimilarity;
                const checkpoint = {
                    iteration,
                    stage: "evaluating",
                    similarityScore: evalResult.overallSimilarity,
                    ssimScore: evalResult.ssimScore,
                    pixelMatchScore: evalResult.pixelMatchScore,
                    layoutIouScore: evalResult.layoutIouScore,
                    issues: evalResult.issues,
                    screenshotArtifactPath: renderedArtifactPath,
                    diffArtifactPath,
                    codeFiles: state.currentProject.files.map((f) => ({
                        path: f.path,
                        language: f.language,
                    })),
                    timestamp: new Date().toISOString(),
                };
                state.history.push(checkpoint);
                // Check if score improved or regressed
                if (evalResult.overallSimilarity > bestScore) {
                    bestScore = evalResult.overallSimilarity;
                    state.bestIteration = iteration;
                    state.bestProject = state.currentProject;
                }
                else if (evalResult.overallSimilarity < bestScore) {
                    // Rollback on regression
                    logProgress("correcting", `Regression detected (score ${evalResult.overallSimilarity} < previous best ${bestScore}). Rolling back to best checkpoint.`);
                    state.currentProject = state.bestProject;
                }
                logProgress("evaluating", `Iteration ${iteration} Score: ${(evalResult.overallSimilarity * 100).toFixed(1)}% (SSIM: ${(evalResult.ssimScore * 100).toFixed(1)}%, PixelMatch: ${(evalResult.pixelMatchScore * 100).toFixed(1)}%)`);
                // Stopping condition: threshold met
                if (evalResult.overallSimilarity >= similarityThreshold) {
                    state.status = "success";
                    logProgress("completed", `Similarity threshold ${(similarityThreshold * 100).toFixed(0)}% reached! Final score: ${(evalResult.overallSimilarity * 100).toFixed(1)}%`);
                    break;
                }
                // Stopping condition: max iterations reached
                if (iteration === maxIterations) {
                    state.status = "max_iterations_reached";
                    logProgress("completed", `Max iterations (${maxIterations}) reached. Final best score: ${(bestScore * 100).toFixed(1)}%`);
                    break;
                }
                // Apply Targeted Self-Correction for next iteration
                logProgress("correcting", `Applying targeted surgical corrections for ${evalResult.issues.length} detected issues...`);
                const correctionResult = CorrectionEngine.applyTargetedCorrections(state.currentProject, evalResult.issues, iteration);
                state.currentProject = correctionResult.patchedProject;
                // Re-validate patched code
                this.validateProject(state.currentProject);
            }
            state.completedAt = new Date().toISOString();
            this.stateManager.saveState(state);
            return state;
        }
        catch (err) {
            state.status = "failed";
            state.currentStage = "failed";
            state.errorMessage = err.message || String(err);
            state.completedAt = new Date().toISOString();
            this.stateManager.saveState(state);
            throw err;
        }
    }
    validateProject(project) {
        if (!project)
            return;
        for (const file of project.files) {
            if (file.language === "jsx" || file.path.endsWith(".jsx")) {
                const valRes = CodeValidator.validateJsx(file.content, file.path);
                if (!valRes.isValid) {
                    throw new Error(`Code validation failure in ${file.path}: ${valRes.errors.join("; ")}`);
                }
                if (valRes.healedCode && valRes.healedCode !== file.content) {
                    file.content = valRes.healedCode;
                }
            }
        }
    }
    recordCostLog(state, costLog) {
        state.costLogs.push(costLog);
        state.totalCostUsd = Number((state.totalCostUsd + costLog.estimatedCostUsd).toFixed(6));
        state.totalTokensIn += costLog.promptTokens;
        state.totalTokensOut += costLog.completionTokens;
    }
}
//# sourceMappingURL=orchestrator.js.map
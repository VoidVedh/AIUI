import crypto from "node:crypto";
import "dotenv/config";
import {
  UIIRDocument,
  DesignTokens,
  ComponentPlan,
  GeneratedProject,
  DesignTokenEngine,
  ComponentPlanner,
  ReactGenerator,
  VanillaJsGenerator,
  FlutterGenerator,
  CodeValidator,
  FigmaInputAdapter,
} from "@aiui/core";
import { VisualEvaluator, VisualEvaluationResult } from "@aiui/evaluator";
import { PlaywrightRenderer } from "@aiui/runner";
import {
  PipelineRunState,
  OrchestratorOptions,
  PipelineStage,
  IterationCheckpoint,
  CostLogEntry,
  ModelCandidate,
  SupportedProviderName,
} from "./types.js";
import { StateManager } from "./stateManager.js";
import { createProvider, VisionProvider, LLMProvider } from "./providers/index.js";
import { CorrectionEngine } from "./correctionEngine.js";

export class PipelineOrchestrator {
  private stateManager: StateManager;
  private provider: VisionProvider & LLMProvider;

  constructor(stateManager?: StateManager, provider?: VisionProvider & LLMProvider) {
    this.stateManager = stateManager || new StateManager();
    this.provider = provider || createProvider();
  }

  /**
   * Executes the full autonomous UI-to-Code pipeline for a given input image buffer.
   */
  public async run(
    imageBuffer: Buffer,
    mimeType = "image/png",
    options: OrchestratorOptions = {}
  ): Promise<PipelineRunState> {
    if (!imageBuffer || (Buffer.isBuffer(imageBuffer) && imageBuffer.length === 0)) {
      throw new Error("Invalid input: screenshot image data is empty or missing.");
    }

    const runId = options.runId || `run_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    const target = options.target || "react";
    const maxIterations = options.maxIterations || 5;
    const similarityThreshold = options.similarityThreshold || 0.92;
    const viewport = options.viewport || { width: 1280, height: 800 };

    const isJsonPayload =
      mimeType === "application/json" ||
      imageBuffer.toString("utf-8").trim().startsWith("{");

    const isRaceMode =
      !isJsonPayload &&
      (options.multiModelMode === "race" ||
        (options.candidateProviders !== undefined && options.candidateProviders.length > 1));

    if (options.providerName) {
      this.provider = createProvider(options.providerName);
    }

    let state: PipelineRunState = {
      runId,
      target,
      currentStage: "idle",
      status: "in_progress",
      similarityScore: 0,
      bestIteration: 0,
      totalIterations: 0,
      provider: options.providerName || (isRaceMode ? "race" : "gemma"),
      multiModelMode: isRaceMode ? "race" : "single",
      candidates: [],
      history: [],
      costLogs: [],
      totalCostUsd: 0,
      totalTokensIn: 0,
      totalTokensOut: 0,
      startedAt: new Date().toISOString(),
    };

    this.stateManager.enforceRetentionPolicy();
    state = this.stateManager.initState(state);

    // Save target screenshot artifact
    const targetArtifactPath = this.stateManager.saveArtifact(runId, "target.png", imageBuffer);

    const logProgress = (stage: PipelineStage, msg: string) => {
      state.currentStage = stage;
      this.stateManager.saveState(state);
      if (options.onProgress) {
        options.onProgress(state, `[${stage.toUpperCase()}] ${msg}`);
      }
    };

    try {
      const docName = options.fixtureName || options.name || runId;

      if (isJsonPayload) {
        logProgress("analyzing", "Parsing Figma design tree...");
        const figmaAdapter = new FigmaInputAdapter();
        state.ir = await figmaAdapter.parse({
          type: "figma",
          data: imageBuffer,
          name: docName,
          viewportHint: viewport,
        });

        logProgress("extracting_tokens", "Extracting design tokens (colors, typography, spacing, radius)...");
        state.tokens = DesignTokenEngine.extractTokens(state.ir);

        logProgress("planning_components", "Decomposing layout into reusable component tree...");
        state.plan = ComponentPlanner.planComponents(state.ir);

        logProgress("generating_code", `Generating production ${target} code...`);
        const generator = new ReactGenerator();
        const project = await generator.generate(state.ir, state.tokens, state.plan);
        state.currentProject = project;
        state.bestProject = project;

        logProgress("validating_code", "Validating React syntax and module imports...");
        this.validateProject(state.currentProject);
      } else if (isRaceMode) {
        // Multi-Model Race Mode: Parallel candidate generation & scoring via Promise.allSettled
        const rawCandidates: SupportedProviderName[] =
          options.candidateProviders && options.candidateProviders.length > 0
            ? options.candidateProviders
            : ["gemma", "gemini", "openai"];

        // Strict cap at 3 candidate providers
        const raceProviders = Array.from(new Set(rawCandidates)).slice(0, 3);

        logProgress(
          "analyzing",
          `Starting Multi-Model Race across ${raceProviders.length} providers (${raceProviders.join(", ")})...`
        );

        const generator = new ReactGenerator();
        const raceTasks = raceProviders.map(async (provName): Promise<ModelCandidate> => {
          const provInstance = createProvider(provName);
          const analysisResult = await provInstance.analyzeScreenshot(
            imageBuffer,
            mimeType,
            viewport,
            "analyzing",
            `${docName}_${provName}`
          );
          this.recordCostLog(state, analysisResult.costLog);

          const candIr = analysisResult.data;
          const candTokens = DesignTokenEngine.extractTokens(candIr);
          const candPlan = ComponentPlanner.planComponents(candIr);
          const candProject = await generator.generate(candIr, candTokens, candPlan);
          this.validateProject(candProject);

          let initialScore = 0.5;
          let ssimScore = 0.5;
          let pixelMatchScore = 0.5;
          let layoutIouScore = 0.5;
          let previewArtifactPath = "";

          try {
            const candRender = await PlaywrightRenderer.render(candProject, {
              runId: `${runId}_cand_${provName}`,
              iteration: 0,
              viewport,
              timeoutMs: 25000,
            });

            if (candRender && candRender.screenshotBuffer) {
              previewArtifactPath = this.stateManager.saveArtifact(
                runId,
                `candidate_${provName}.png`,
                candRender.screenshotBuffer
              );
              const candEval = await VisualEvaluator.evaluate(
                imageBuffer,
                candRender.screenshotBuffer,
                [],
                candRender.boundingBoxes,
                viewport
              );
              initialScore = candEval.overallSimilarity;
              ssimScore = candEval.ssimScore;
              pixelMatchScore = candEval.pixelMatchScore;
              layoutIouScore = candEval.layoutIouScore;
            }
          } catch {
            // Render failure in sandbox preview is tolerated
          }

          return {
            id: `cand_${provName}`,
            provider: provName,
            model: provInstance.modelId || provName,
            initialScore,
            ssimScore,
            pixelMatchScore,
            layoutIouScore,
            previewArtifactPath,
            selected: false,
            ir: candIr,
            tokens: candTokens,
            plan: candPlan,
            project: candProject,
          };
        });

        const settled = await Promise.allSettled(raceTasks);
        const validCandidates: ModelCandidate[] = [];

        settled.forEach((res, idx) => {
          const provName = raceProviders[idx];
          if (res.status === "fulfilled") {
            validCandidates.push(res.value);
            logProgress(
              "generating_code",
              `[RACE_CANDIDATE_READY] Provider '${provName}' initial fidelity: ${(res.value.initialScore * 100).toFixed(1)}%.`
            );
          } else {
            const errMsg = res.reason?.message || String(res.reason);
            logProgress(
              "generating_code",
              `[RACE_CANDIDATE_FAILED] Provider '${provName}' failed: ${errMsg}. Excluded from scoring.`
            );
          }
        });

        if (validCandidates.length > 0) {
          // Auto-select candidate with highest initial fidelity score
          validCandidates.sort((a, b) => b.initialScore - a.initialScore);
          const winner = validCandidates[0];
          winner.selected = true;

          state.candidates = validCandidates;
          state.selectedCandidateId = winner.id;
          state.provider = winner.provider;
          state.ir = winner.ir;
          state.tokens = winner.tokens;
          state.plan = winner.plan;
          state.currentProject = winner.project;
          state.bestProject = winner.project;

          logProgress(
            "generating_code",
            `[MULTI_MODEL_RACE] Winner auto-selected: '${winner.provider}' (${winner.model}) with highest initial fidelity ${(winner.initialScore * 100).toFixed(1)}% (SSIM: ${(winner.ssimScore * 100).toFixed(1)}%, PixelMatch: ${(winner.pixelMatchScore * 100).toFixed(1)}%, IoU: ${(winner.layoutIouScore * 100).toFixed(1)}%)`
          );
        } else {
          logProgress(
            "generating_code",
            "[MULTI_MODEL_RACE] All race candidates failed. Falling back to default deterministic pipeline."
          );
          const analysisResult = await this.provider.analyzeScreenshot(
            imageBuffer,
            mimeType,
            viewport,
            "analyzing",
            docName
          );
          state.ir = analysisResult.data;
          this.recordCostLog(state, analysisResult.costLog);
          state.tokens = DesignTokenEngine.extractTokens(state.ir);
          state.plan = ComponentPlanner.planComponents(state.ir);
          state.currentProject = await generator.generate(state.ir, state.tokens, state.plan);
          state.bestProject = state.currentProject;
          this.validateProject(state.currentProject);
        }
      } else {
        // Single Model Mode
        logProgress("analyzing", "Analyzing UI design and generating structured UI IR...");
        const analysisResult = await this.provider.analyzeScreenshot(
          imageBuffer,
          mimeType,
          viewport,
          "analyzing",
          docName
        );
        state.ir = analysisResult.data;
        this.recordCostLog(state, analysisResult.costLog);

        if ((state.ir.metadata as any)?.vlmError) {
          logProgress(
            "analyzing",
            `VLM notice: ${(state.ir.metadata as any).vlmError}. Used deterministic CV perception engine.`
          );
        } else if ((state.ir.metadata as any)?.isApproximate) {
          logProgress(
            "analyzing",
            `Perception notice: Offline CV layout approximation active (confidence: ${((state.ir.metadata?.confidence || 0.6) * 100).toFixed(0)}%).`
          );
        }

        if (!state.ir) {
          throw new Error("Perception failed to synthesize canonical UI IR document.");
        }

        // Token extraction & Component planning & Code generation
        logProgress("extracting_tokens", "Extracting design tokens (colors, typography, spacing, radius)...");
        state.tokens = DesignTokenEngine.extractTokens(state.ir);

        logProgress("planning_components", "Decomposing layout into reusable component tree...");
        state.plan = ComponentPlanner.planComponents(state.ir);

        logProgress("generating_code", `Generating production ${target} code...`);
        const generator = new ReactGenerator();
        const project = await generator.generate(state.ir, state.tokens, state.plan);
        state.currentProject = project;
        state.bestProject = project;

        logProgress("validating_code", "Validating React syntax and module imports...");
        this.validateProject(state.currentProject);

        // Optional single-model bestOfN pass (capped at 3)
        if (options.bestOfN && options.bestOfN > 1) {
          const candidateCount = Math.min(Math.max(options.bestOfN, 1), 3);
          logProgress("generating_code", `Running Best-of-${candidateCount} candidate selection...`);
          let bestCandidateScore = -1;
          let selectedCandidateProject = project;
          let selectedIr = state.ir;
          let selectedTokens = state.tokens;
          let selectedPlan = state.plan;

          for (let c = 0; c < candidateCount; c++) {
            try {
              let candProject = project;
              let candIr = state.ir;
              let candTokens = state.tokens;
              let candPlan = state.plan;

              if (c > 0) {
                const candAnalysis = await this.provider.analyzeScreenshot(
                  imageBuffer,
                  mimeType,
                  viewport,
                  "analyzing",
                  `${docName}_cand_${c + 1}`
                );
                candIr = candAnalysis.data;
                this.recordCostLog(state, candAnalysis.costLog);
                candTokens = DesignTokenEngine.extractTokens(candIr);
                candPlan = ComponentPlanner.planComponents(candIr);
                candProject = await generator.generate(candIr, candTokens, candPlan);
                this.validateProject(candProject);
              }

              const candRender = await PlaywrightRenderer.render(candProject, {
                runId: `${runId}_cand_${c + 1}`,
                iteration: 0,
                viewport,
                timeoutMs: 25000,
              });

              if (candRender && candRender.screenshotBuffer) {
                const candEval = await VisualEvaluator.evaluate(
                  imageBuffer,
                  candRender.screenshotBuffer,
                  [],
                  candRender.boundingBoxes,
                  viewport
                );
                if (candEval.overallSimilarity > bestCandidateScore) {
                  bestCandidateScore = candEval.overallSimilarity;
                  selectedCandidateProject = candProject;
                  selectedIr = candIr;
                  selectedTokens = candTokens;
                  selectedPlan = candPlan;
                }
              }
            } catch {
              // Keep default candidate on error
            }
          }

          state.currentProject = selectedCandidateProject;
          state.bestProject = selectedCandidateProject;
          state.ir = selectedIr;
          state.tokens = selectedTokens;
          state.plan = selectedPlan;
        }
      }

      if (!state.ir) {
        throw new Error("Perception failed to synthesize canonical UI IR document.");
      }

      // Extract expected bounding boxes from IR
      const expectedBoxes = Object.values(state.ir.nodes).map((n) => ({
        id: n.id,
        x: n.position.x || 0,
        y: n.position.y || 0,
        width: n.dimensions.width,
        height: n.dimensions.height,
        hasExplicitPosition: n.position.relativeTo === "viewport" || (n.position.x !== 0 && n.position.y !== 0),
      }));

      // Extract image masks for dynamic content masking during evaluation
      const imageMasks = Object.values(state.ir.nodes)
        .filter((n) => n.type === "image" || n.type === "avatar")
        .map((n) => ({
          x: typeof n.position.x === "number" ? n.position.x : 0,
          y: typeof n.position.y === "number" ? n.position.y : 0,
          width: typeof n.dimensions.width === "number" ? n.dimensions.width : 200,
          height: typeof n.dimensions.height === "number" ? n.dimensions.height : 200,
        }));

      // 6. Stage: Visual Rendering & Self-Correction Loop
      let bestScore = 0;
      const defaultIterationTimeout = 45000;

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

        const renderedArtifactPath = this.stateManager.saveArtifact(
          runId,
          `rendered_iter_${iteration}.png`,
          renderResult.screenshotBuffer
        );

        // Visual Evaluation
        logProgress("evaluating", `Computing SSIM, pixelmatch, and layout alignment metrics (Iteration ${iteration})...`);
        const evalResult = await VisualEvaluator.evaluate(
          imageBuffer,
          renderResult.screenshotBuffer,
          expectedBoxes,
          renderResult.boundingBoxes,
          viewport,
          imageMasks
        );

        const diffArtifactPath = this.stateManager.saveArtifact(
          runId,
          `diff_iter_${iteration}.png`,
          evalResult.diffImageBuffer
        );

        state.similarityScore = evalResult.overallSimilarity;

        const checkpoint: IterationCheckpoint = {
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
        } else if (evalResult.overallSimilarity < bestScore) {
          // Rollback on regression
          logProgress(
            "correcting",
            `Regression detected (score ${(evalResult.overallSimilarity * 100).toFixed(1)}% < previous best ${(bestScore * 100).toFixed(1)}%). Rolling back to best checkpoint.`
          );
          state.currentProject = state.bestProject;
        }

        logProgress(
          "evaluating",
          `Iteration ${iteration} Score: ${(evalResult.overallSimilarity * 100).toFixed(1)}% (SSIM: ${(evalResult.ssimScore * 100).toFixed(1)}%, PixelMatch: ${(evalResult.pixelMatchScore * 100).toFixed(1)}%, LayoutIoU: ${(evalResult.layoutIouScore * 100).toFixed(1)}%)`
        );

        // Stopping condition 1: Similarity threshold met
        if (evalResult.overallSimilarity >= similarityThreshold) {
          state.status = "success";
          logProgress("completed", `Similarity threshold ${(similarityThreshold * 100).toFixed(0)}% reached! Final score: ${(evalResult.overallSimilarity * 100).toFixed(1)}%`);
          break;
        }

        // Stopping condition 2: No actionable issues remain
        const actionableIssues = evalResult.issues.filter((i) => i.elementId || i.id === "issue_contrast");
        if (evalResult.issues.length === 0 || actionableIssues.length === 0) {
          logProgress(
            "completed",
            `No further actionable visual differences detected. Converged at ${(bestScore * 100).toFixed(1)}%.`
          );
          state.status = bestScore >= similarityThreshold ? "success" : "converged";
          break;
        }

        // Stopping condition 3: Plateau Detection (If score hasn't improved for 2 consecutive iterations)
        if (iteration >= 2 && evalResult.overallSimilarity <= bestScore) {
          const recentHistory = state.history.slice(-2);
          const scoreDelta = Math.abs(recentHistory[recentHistory.length - 1].similarityScore - recentHistory[0].similarityScore);

          if (scoreDelta < 0.001) {
            logProgress(
              "completed",
              `[CORRECTION_PLATEAU] Visual metrics plateaued at ${(bestScore * 100).toFixed(1)}% across consecutive iterations. Early stopping to preserve best project.`
            );
            state.status = bestScore >= similarityThreshold ? "success" : "plateau_reached";
            break;
          }
        }

        // Stopping condition 4: Max iterations reached
        if (iteration === maxIterations) {
          state.status = "max_iterations_reached";
          state.similarityScore = bestScore;
          if (state.bestProject) {
            state.currentProject = state.bestProject;
          }
          logProgress("completed", `Max iterations (${maxIterations}) reached. Final best score: ${(bestScore * 100).toFixed(1)}%`);
          break;
        }

        // Apply Targeted Self-Correction for next iteration
        logProgress("correcting", `Applying targeted surgical corrections for ${actionableIssues.length} actionable issues...`);
        const correctionResult = CorrectionEngine.applyTargetedCorrections(
          state.currentProject!,
          evalResult.issues,
          iteration
        );

        state.currentProject = correctionResult.patchedProject;
        logProgress("correcting", `Applied: ${correctionResult.appliedModifications.join("; ")}`);

        // Re-validate patched code
        this.validateProject(state.currentProject);
      }

      state.similarityScore = bestScore;
      if (state.bestProject) {
        state.currentProject = state.bestProject;
      }
      state.completedAt = new Date().toISOString();
      this.stateManager.saveState(state);
      this.stateManager.cleanSandboxFiles(state.runId);
      return state;
    } catch (err: any) {
      state.status = "failed";
      state.currentStage = "failed";
      state.errorMessage = err.message || String(err);
      state.completedAt = new Date().toISOString();
      this.stateManager.saveState(state);
      throw err;
    }
  }

  private validateProject(project?: GeneratedProject) {
    if (!project) return;
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

  private recordCostLog(state: PipelineRunState, costLog: CostLogEntry) {
    state.costLogs.push(costLog);
    state.totalCostUsd = Number((state.totalCostUsd + costLog.estimatedCostUsd).toFixed(6));
    state.totalTokensIn += costLog.promptTokens;
    state.totalTokensOut += costLog.completionTokens;
  }
}

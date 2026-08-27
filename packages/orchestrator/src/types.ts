import { UIIRDocument, DesignTokens, ComponentPlan, GeneratedProject } from "@aiui/core";
import { VisualEvaluationResult, VisualIssue } from "@aiui/evaluator";

export type PipelineStage =
  | "idle"
  | "analyzing"
  | "extracting_tokens"
  | "planning_components"
  | "generating_code"
  | "validating_code"
  | "rendering"
  | "evaluating"
  | "correcting"
  | "completed"
  | "failed";

export interface CostLogEntry {
  stage: PipelineStage;
  provider: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  estimatedCostUsd: number;
  latencyMs: number;
  timestamp: string;
}

export interface IterationCheckpoint {
  iteration: number;
  stage: PipelineStage;
  similarityScore: number;
  ssimScore: number;
  pixelMatchScore: number;
  layoutIouScore: number;
  issues: VisualIssue[];
  screenshotArtifactPath: string;
  diffArtifactPath: string;
  codeFiles: Array<{ path: string; language: string }>;
  timestamp: string;
}

export type TargetFramework = "react";

export interface PipelineRunState {
  runId: string;
  target: TargetFramework;
  currentStage: PipelineStage;
  status: "in_progress" | "success" | "max_iterations_reached" | "failed";
  similarityScore: number;
  bestIteration: number;
  totalIterations: number;
  ir?: UIIRDocument;
  tokens?: DesignTokens;
  plan?: ComponentPlan;
  bestProject?: GeneratedProject;
  currentProject?: GeneratedProject;
  history: IterationCheckpoint[];
  costLogs: CostLogEntry[];
  totalCostUsd: number;
  totalTokensIn: number;
  totalTokensOut: number;
  errorMessage?: string;
  startedAt: string;
  completedAt?: string;
}

export interface OrchestratorOptions {
  runId?: string;
  name?: string;
  fixtureName?: string;
  target?: "react";
  maxIterations?: number;
  similarityThreshold?: number;
  iterationTimeoutMs?: number;
  runTimeoutMs?: number;
  viewport?: { width: number; height: number };
  providerName?: "gemini" | "openai" | "anthropic" | "offline";
  onProgress?: (state: PipelineRunState, logMessage: string) => void;
}

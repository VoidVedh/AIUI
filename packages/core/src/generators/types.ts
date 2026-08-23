import { UIIRDocument } from "../types/ir.js";
import { DesignTokens } from "../types/tokens.js";
import { ComponentPlan } from "../types/planner.js";
import { GeneratedProject } from "../types/generator.js";

export interface TargetCodeGenerator {
  readonly target: "react" | "vanillajs" | "flutter";
  generate(ir: UIIRDocument, tokens: DesignTokens, plan: ComponentPlan): Promise<GeneratedProject>;
}

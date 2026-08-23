import { DesignTokens } from "../types/tokens.js";
import { UIIRDocument } from "../types/ir.js";
import { ComponentPlan } from "../types/planner.js";
import { GeneratedProject } from "../types/generator.js";
import { TargetCodeGenerator } from "./types.js";
export declare class VanillaJsGenerator implements TargetCodeGenerator {
    readonly target: "vanillajs";
    /**
     * Generates a complete, runnable Vanilla JS (HTML5 + CSS3 + ES6) project.
     */
    generate(ir: UIIRDocument, tokens: DesignTokens, plan: ComponentPlan): Promise<GeneratedProject>;
    private generateGlobalCss;
    private renderNodeToHtml;
    private resolveHtmlTag;
    private nodeStyleToCssInline;
    private escapeHtml;
}
//# sourceMappingURL=vanillaJsGenerator.d.ts.map
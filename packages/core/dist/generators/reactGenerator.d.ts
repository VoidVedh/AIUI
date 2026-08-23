import { UIIRDocument } from "../types/ir.js";
import { DesignTokens } from "../types/tokens.js";
import { ComponentPlan } from "../types/planner.js";
import { GeneratedProject } from "../types/generator.js";
import { TargetCodeGenerator } from "./types.js";
export declare class ReactGenerator implements TargetCodeGenerator {
    readonly target: "react";
    generate(ir: UIIRDocument, tokens: DesignTokens, plan: ComponentPlan): Promise<GeneratedProject>;
    private generateGlobalCss;
    private generateAppComponent;
    private generateSubComponent;
    private renderNodeToJsx;
    private resolveHtmlTag;
    private resolveLucideIcon;
    private nodeStyleToReactInline;
    private escapeHtml;
    private escapeJsxText;
}
//# sourceMappingURL=reactGenerator.d.ts.map
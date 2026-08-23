import { DesignTokens } from "../types/tokens.js";
import { UIIRDocument } from "../types/ir.js";
import { ComponentPlan } from "../types/planner.js";
import { GeneratedProject } from "../types/generator.js";
import { TargetCodeGenerator } from "./types.js";
export declare class FlutterGenerator implements TargetCodeGenerator {
    readonly target: "flutter";
    /**
     * Generates a complete, runnable Flutter/Dart project (pubspec.yaml + lib/main.dart).
     */
    generate(ir: UIIRDocument, tokens: DesignTokens, plan: ComponentPlan): Promise<GeneratedProject>;
    private generateMainDart;
    private renderNodeToFlutter;
    private escapeDartString;
}
//# sourceMappingURL=flutterGenerator.d.ts.map
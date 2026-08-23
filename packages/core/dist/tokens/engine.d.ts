import { UIIRDocument } from "../types/ir.js";
import { DesignTokens } from "../types/tokens.js";
export declare class DesignTokenEngine {
    /**
     * Extracts a complete DesignTokens structure from a UIIRDocument.
     */
    static extractTokens(ir: UIIRDocument): DesignTokens;
    /**
     * Generates CSS Custom Properties `:root { ... }` from DesignTokens.
     */
    static toCssVariables(tokens: DesignTokens): string;
    private static inferPrimaryColor;
    private static inferSurfaceColor;
    private static inferSurfaceCardColor;
    private static inferTextMutedColor;
    private static inferBorderColor;
    private static inferAccentColor;
    private static isNeutral;
}
//# sourceMappingURL=engine.d.ts.map
export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    healedCode?: string;
}
export declare class CodeValidator {
    private static readonly ALLOWED_IMPORT_MODULES;
    private static readonly FORBIDDEN_MODULES;
    /**
     * Validates JSX/JS code using Babel AST parser and checks for security/syntax correctness.
     */
    static validateJsx(code: string, filePath?: string): ValidationResult;
    private static tryParseBabel;
    /**
     * Auto-heals common JSX authoring and LLM generation glitches.
     */
    static autoHealJsx(code: string, errorMsg: string): string;
}
//# sourceMappingURL=codeValidator.d.ts.map
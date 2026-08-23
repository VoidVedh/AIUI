import { parse } from "@babel/parser";

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  healedCode?: string;
}

export class CodeValidator {
  private static readonly ALLOWED_IMPORT_MODULES = new Set([
    "react",
    "react-dom",
    "react-dom/client",
    "lucide-react",
    "./index.css",
    "../index.css",
    "./components/",
  ]);

  private static readonly FORBIDDEN_MODULES = new Set([
    "child_process",
    "fs",
    "path",
    "net",
    "http",
    "https",
    "crypto",
    "os",
    "process",
    "vm",
  ]);

  /**
   * Validates JSX/JS code using Babel AST parser and checks for security/syntax correctness.
   */
  public static validateJsx(code: string, filePath: string = "Component.jsx"): ValidationResult {
    const errors: string[] = [];
    let healed = code;

    // 1. Check for dangerous / unwhitelisted patterns
    for (const forbidden of this.FORBIDDEN_MODULES) {
      if (
        new RegExp(`from\\s+['"]${forbidden}['"]`, "i").test(healed) ||
        new RegExp(`require\\s*\\(\\s*['"]${forbidden}['"]\\s*\\)`, "i").test(healed)
      ) {
        errors.push(`Security violation: import of forbidden module '${forbidden}' in ${filePath}`);
      }
    }

    if (/eval\s*\(/i.test(healed)) {
      errors.push(`Security violation: use of eval() in ${filePath}`);
    }

    if (errors.length > 0) {
      return { isValid: false, errors };
    }

    // 2. Syntax Parsing Attempt 1
    try {
      this.tryParseBabel(healed);
      return { isValid: true, errors: [], healedCode: healed };
    } catch (parseErr: any) {
      // 3. Attempt Auto-healing
      healed = this.autoHealJsx(healed, parseErr.message);

      try {
        this.tryParseBabel(healed);
        return { isValid: true, errors: [], healedCode: healed };
      } catch (retryErr: any) {
        return {
          isValid: false,
          errors: [`JSX Syntax error in ${filePath}: ${retryErr.message}`],
          healedCode: undefined,
        };
      }
    }
  }

  private static tryParseBabel(code: string) {
    parse(code, {
      sourceType: "module",
      plugins: ["jsx", "typescript"],
    });
  }

  /**
   * Auto-heals common JSX authoring and LLM generation glitches.
   */
  public static autoHealJsx(code: string, errorMsg: string): string {
    let result = code;

    // Ensure React import exists
    if (!/import\s+React/i.test(result) && !/import\s+.*\s+from\s+['"]react['"]/i.test(result)) {
      result = `import React from 'react';\n${result}`;
    }

    // Self-close void tags if unclosed: <img>, <input>, <hr>, <br>
    result = result.replace(/<img\s+([^>]*[^\/>])>/gi, "<img $1 />");
    result = result.replace(/<input\s+([^>]*[^\/>])>/gi, "<input $1 />");
    result = result.replace(/<hr\s*>/gi, "<hr />");
    result = result.replace(/<br\s*>/gi, "<br />");

    // Replace unescaped raw HTML entities in JSX text
    // Replace unescaped & with &amp; if not part of entity
    result = result.replace(/&(?!(amp|lt|gt|quot|#\d+|#x[0-9a-f]+);)/gi, "&amp;");

    // Fix style objects if rendered as style="color: red" -> style={{ color: 'red' }}
    result = result.replace(/style="([^"]*)"/g, (match, styleStr) => {
      const parts = styleStr.split(";").filter(Boolean);
      const entries: string[] = [];
      for (const p of parts) {
        const [k, v] = p.split(":");
        if (k && v) {
          const camelKey = k.trim().replace(/-([a-z])/g, (_: string, c: string) => c.toUpperCase());
          entries.push(`${camelKey}: '${v.trim()}'`);
        }
      }
      return `style={{ ${entries.join(", ")} }}`;
    });

    return result;
  }
}

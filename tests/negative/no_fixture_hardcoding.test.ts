import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("Anti-Overfitting Negative Test: No Fixture-Specific Hardcoding", () => {
  const FORBIDDEN_TOKENS = [
    // Matrix template tokens
    "matrix_wrap",
    "matrix_grid",
    "_cell_",

    // Internal fixture names
    "dense-matrix-table",
    "landing-page",
    "ugeek-signin",
    "checkout-summary",

    // Hardcoded placeholder strings
    "Operations Hub",
    "Account Portal",
    "Sign In to Your Account",
    "Application Suite",
    "Transform Workflows Into Production Results",
  ];

  // Scans source directories for production packages
  const SCAN_DIRS = [
    path.resolve(process.cwd(), "packages/core/src"),
    path.resolve(process.cwd(), "packages/orchestrator/src"),
  ];

  function getFilesRecursive(dir: string): string[] {
    if (!fs.existsSync(dir)) return [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const files: string[] = [];
    for (const e of entries) {
      const fullPath = path.join(dir, e.name);
      if (e.isDirectory()) {
        files.push(...getFilesRecursive(fullPath));
      } else if (e.isFile() && (fullPath.endsWith(".ts") || fullPath.endsWith(".tsx"))) {
        // Exclude test files from anti-hardcoding test themselves
        if (!fullPath.includes(".test.") && !fullPath.includes(".spec.")) {
          files.push(fullPath);
        }
      }
    }
    return files;
  }

  it("packages/core/src and packages/orchestrator/src must contain zero fixture-specific hardcoded selectors or strings", () => {
    const violations: { file: string; token: string; line: number }[] = [];

    for (const dir of SCAN_DIRS) {
      const files = getFilesRecursive(dir);
      for (const file of files) {
        const content = fs.readFileSync(file, "utf-8");
        const lines = content.split("\n");
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          for (const token of FORBIDDEN_TOKENS) {
            if (line.includes(token)) {
              violations.push({ file: path.relative(process.cwd(), file), token, line: i + 1 });
            }
          }
        }
      }
    }

    expect(
      violations,
      `Found ${violations.length} forbidden fixture-hardcoded token(s) in source directories:\n` +
        violations.map((v) => `  - ${v.file}:${v.line} matches "${v.token}"`).join("\n")
    ).toEqual([]);
  });
});

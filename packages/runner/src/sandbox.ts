import fs from "node:fs";
import path from "node:path";
import { GeneratedProject } from "@aiui/core";

export interface SandboxConfig {
  runId: string;
  iteration: number;
  baseDir?: string;
}

function findMonorepoRoot(startDir = process.cwd()): string {
  let curr = startDir;
  while (curr && curr !== path.dirname(curr)) {
    if (fs.existsSync(path.join(curr, "packages")) && fs.existsSync(path.join(curr, "node_modules", "react"))) {
      return curr;
    }
    curr = path.dirname(curr);
  }
  return process.cwd();
}

export class SandboxManager {
  /**
   * Cleanses environment variables so generated code execution cannot leak API keys or host credentials.
   */
  public static getSanitizedEnv(): NodeJS.ProcessEnv {
    const safeKeys = [
      "NODE_ENV",
      "PATH",
      "HOME",
      "TMPDIR",
      "SHELL",
      "USER",
      "LANG",
      "LC_ALL",
    ];

    const sanitized: NodeJS.ProcessEnv = {};
    for (const key of safeKeys) {
      if (process.env[key]) {
        sanitized[key] = process.env[key];
      }
    }

    sanitized.NODE_ENV = "development";
    return sanitized;
  }

  /**
   * Prepares an ephemeral sandbox directory populated with the generated project files.
   */
  public static async prepareSandbox(
    project: GeneratedProject,
    config: SandboxConfig
  ): Promise<string> {
    const rootBase = config.baseDir || path.resolve(findMonorepoRoot(), "runs");
    const sandboxDir = path.join(rootBase, config.runId, `sandbox_iter_${config.iteration}`);

    if (fs.existsSync(sandboxDir)) {
      fs.rmSync(sandboxDir, { recursive: true, force: true });
    }
    fs.mkdirSync(sandboxDir, { recursive: true });

    // Write all project files
    for (const file of project.files) {
      const filePath = path.join(sandboxDir, file.path);
      const parentDir = path.dirname(filePath);
      if (!fs.existsSync(parentDir)) {
        fs.mkdirSync(parentDir, { recursive: true });
      }
      fs.writeFileSync(filePath, file.content, "utf-8");
    }

    // Ensure an index.html exists in sandbox directory for Vite rendering if target is non-web (e.g. Flutter)
    const indexPath = path.join(sandboxDir, "index.html");
    if (!fs.existsSync(indexPath)) {
      const fallbackHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>AIUI Flutter Web Preview</title>
    <style>
      body { margin: 0; background: #0F172A; color: #F8FAFC; font-family: Inter, system-ui, sans-serif; }
      #root { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px; }
      .card { background: #1E293B; border: 1px solid #334155; border-radius: 12px; padding: 32px; max-width: 600px; text-align: center; }
      h1 { font-size: 24px; color: #38BDF8; margin-bottom: 12px; }
      p { color: #94A3B8; font-size: 15px; line-height: 1.6; }
      .badge { display: inline-block; background: rgba(56, 189, 248, 0.15); color: #38BDF8; padding: 6px 14px; border-radius: 20px; font-weight: 600; font-size: 13px; margin-bottom: 16px; }
    </style>
  </head>
  <body>
    <div id="root">
      <div class="card">
        <span class="badge">Flutter 3.x Dart Code Synthesized</span>
        <h1>Flutter Dart Code Generated</h1>
        <p>AIUI has synthesized complete Flutter Dart widget trees in <code>lib/main.dart</code> and <code>pubspec.yaml</code>. Inspect the code in the Code Explorer or download the project ZIP.</p>
      </div>
    </div>
  </body>
</html>`;
      fs.writeFileSync(indexPath, fallbackHtml, "utf-8");
    }

    return sandboxDir;
  }

  /**
   * Clean up ephemeral sandbox directory.
   */
  public static async cleanupSandbox(sandboxDir: string): Promise<void> {
    try {
      if (fs.existsSync(sandboxDir)) {
        fs.rmSync(sandboxDir, { recursive: true, force: true });
      }
    } catch {
      // Best-effort cleanup
    }
  }
}

import fs from "node:fs";
import path from "node:path";
import { GeneratedProject } from "@aiui/core";

export interface SandboxConfig {
  runId: string;
  iteration: number;
  baseDir?: string;
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
    const rootBase = config.baseDir || path.resolve(process.cwd(), "runs");
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

    // Link template node_modules if present in monorepo root or packages/runner
    const rootNodeModules = path.resolve(process.cwd(), "node_modules");
    const targetNodeModules = path.join(sandboxDir, "node_modules");

    if (fs.existsSync(rootNodeModules) && !fs.existsSync(targetNodeModules)) {
      try {
        fs.symlinkSync(rootNodeModules, targetNodeModules, "junction");
      } catch {
        // Fallback if symlink fails
      }
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

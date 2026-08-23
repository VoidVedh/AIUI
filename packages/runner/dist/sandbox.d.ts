import { GeneratedProject } from "@aiui/core";
export interface SandboxConfig {
    runId: string;
    iteration: number;
    baseDir?: string;
}
export declare class SandboxManager {
    /**
     * Cleanses environment variables so generated code execution cannot leak API keys or host credentials.
     */
    static getSanitizedEnv(): NodeJS.ProcessEnv;
    /**
     * Prepares an ephemeral sandbox directory populated with the generated project files.
     */
    static prepareSandbox(project: GeneratedProject, config: SandboxConfig): Promise<string>;
    /**
     * Clean up ephemeral sandbox directory.
     */
    static cleanupSandbox(sandboxDir: string): Promise<void>;
}
//# sourceMappingURL=sandbox.d.ts.map
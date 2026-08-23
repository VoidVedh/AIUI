import { Browser } from "playwright";
import { GeneratedProject } from "@aiui/core";
export interface RenderResult {
    screenshotBuffer: Buffer;
    boundingBoxes: Array<{
        id: string;
        x: number;
        y: number;
        width: number;
        height: number;
    }>;
    sandboxDir: string;
    serverUrl: string;
}
export interface RenderOptions {
    runId: string;
    iteration: number;
    viewport?: {
        width: number;
        height: number;
    };
    timeoutMs?: number;
}
export declare class PlaywrightRenderer {
    private static browserInstance;
    /**
     * Lazily initializes and reuses a Chromium browser instance for fast rendering.
     */
    static getBrowser(): Promise<Browser>;
    /**
     * Closes the global browser instance if open.
     */
    static closeBrowser(): Promise<void>;
    /**
     * Executes and renders a GeneratedProject inside an isolated sandbox and captures screenshot + DOM layout.
     */
    static render(project: GeneratedProject, options: RenderOptions): Promise<RenderResult>;
}
//# sourceMappingURL=renderer.d.ts.map
import { Browser } from "playwright";
import { GeneratedProject } from "@aiui/core";
export interface DOMElementFact {
    id: string;
    dataAiuiId?: string;
    tag: string;
    x: number;
    y: number;
    width: number;
    height: number;
    computedStyles: {
        backgroundColor?: string;
        color?: string;
        fontFamily?: string;
        fontSize?: string;
        fontWeight?: string;
        lineHeight?: string;
        border?: string;
        borderRadius?: string;
        padding?: string;
        margin?: string;
        display?: string;
        opacity?: string;
        position?: string;
        zIndex?: string;
    };
    depth: number;
}
export interface RenderResult {
    screenshotBuffer: Buffer;
    boundingBoxes: Array<DOMElementFact>;
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
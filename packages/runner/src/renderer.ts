import fs from "node:fs";
import path from "node:path";
import { chromium, Browser, Page } from "playwright";
import { createServer, ViteDevServer } from "vite";
import react from "@vitejs/plugin-react";
import { GeneratedProject } from "@aiui/core";
import { SandboxManager } from "./sandbox.js";

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
  viewport?: { width: number; height: number };
  timeoutMs?: number;
}

export class PlaywrightRenderer {
  private static browserInstance: Browser | null = null;

  /**
   * Lazily initializes and reuses a Chromium browser instance for fast rendering.
   */
  public static async getBrowser(): Promise<Browser> {
    if (!this.browserInstance || !this.browserInstance.isConnected()) {
      this.browserInstance = await chromium.launch({
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-accelerated-2d-canvas",
          "--no-first-run",
          "--no-zygote",
          "--disable-gpu",
        ],
      });
    }
    return this.browserInstance;
  }

  /**
   * Closes the global browser instance if open.
   */
  public static async closeBrowser(): Promise<void> {
    if (this.browserInstance) {
      await this.browserInstance.close();
      this.browserInstance = null;
    }
  }

  /**
   * Executes and renders a GeneratedProject inside an isolated sandbox and captures screenshot + DOM layout.
   */
  public static async render(
    project: GeneratedProject,
    options: RenderOptions
  ): Promise<RenderResult> {
    const viewport = options.viewport || { width: 1280, height: 800 };
    const timeoutMs = options.timeoutMs || 45000;

    // 1. Prepare sandbox files
    const sandboxDir = await SandboxManager.prepareSandbox(project, {
      runId: options.runId,
      iteration: options.iteration,
    });

    let viteServer: ViteDevServer | null = null;
    let page: Page | null = null;

    try {
      const monoRoot = findMonorepoRoot();
      const reactPkg = path.resolve(monoRoot, "node_modules/react");
      const reactDomPkg = path.resolve(monoRoot, "node_modules/react-dom");
      const lucidePkg = path.resolve(monoRoot, "node_modules/lucide-react");

      viteServer = await createServer({
        root: sandboxDir,
        configFile: false,
        plugins: [react() as any],
        resolve: {
          alias: [
            { find: "react/jsx-dev-runtime", replacement: path.resolve(reactPkg, "jsx-dev-runtime.js") },
            { find: "react/jsx-runtime", replacement: path.resolve(reactPkg, "jsx-runtime.js") },
            { find: "react-dom/client", replacement: path.resolve(reactDomPkg, "client.js") },
            { find: "react-dom", replacement: reactDomPkg },
            { find: "react", replacement: reactPkg },
            { find: "lucide-react", replacement: lucidePkg },
          ],
        },
        server: {
          port: 0, // Auto-select available port
          host: "127.0.0.1",
          strictPort: false,
          fs: {
            strict: false,
            allow: [monoRoot, process.cwd(), sandboxDir],
          },
        },
        logLevel: "error",
      });

      await viteServer.listen();
      const serverPort = viteServer.httpServer?.address();
      const portNumber = typeof serverPort === "object" && serverPort ? serverPort.port : 3000;
      const serverUrl = `http://127.0.0.1:${portNumber}`;

      // 3. Launch browser page
      const browser = await this.getBrowser();
      page = await browser.newPage({
        viewport: { width: viewport.width, height: viewport.height },
        deviceScaleFactor: 1,
      });

      // 4. Navigate and wait for DOM + network idle
      await page.goto(serverUrl, { waitUntil: "networkidle", timeout: timeoutMs });
      await page.waitForSelector("#root", { state: "attached", timeout: 10000 });
      await page.waitForSelector("#root > *", { state: "attached", timeout: 10000 }).catch(() => {});

      // Allow CSS layout and font rendering to fully settle
      await page.waitForTimeout(500);

      // 5. Capture screenshot
      const screenshotBuffer = await page.screenshot({
        type: "png",
        fullPage: false,
        clip: { x: 0, y: 0, width: viewport.width, height: viewport.height },
      });

      // 6. Extract DOM bounding boxes for all tagged IDs
      const boundingBoxes = await page.evaluate(() => {
        const elements = document.querySelectorAll("[id]");
        const boxes: Array<{ id: string; x: number; y: number; width: number; height: number }> = [];

        elements.forEach((el) => {
          const rect = el.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            boxes.push({
              id: el.id,
              x: Math.round(rect.left),
              y: Math.round(rect.top),
              width: Math.round(rect.width),
              height: Math.round(rect.height),
            });
          }
        });

        return boxes;
      });

      return {
        screenshotBuffer: Buffer.from(screenshotBuffer),
        boundingBoxes,
        sandboxDir,
        serverUrl,
      };
    } finally {
      if (page) {
        await page.close().catch(() => {});
      }
      if (viteServer) {
        await viteServer.close().catch(() => {});
      }
    }
  }
}

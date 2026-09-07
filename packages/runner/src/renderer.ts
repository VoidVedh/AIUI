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
  viewport?: { width: number; height: number };
  timeoutMs?: number;
}

export class PlaywrightRenderer {
  private static browserInstance: Browser | null = null;
  private static activeServers = new Set<ViteDevServer>();
  private static cleanupRegistered = false;

  private static registerProcessHandlers(): void {
    if (this.cleanupRegistered) return;
    this.cleanupRegistered = true;

    process.on("exit", () => this.cleanupSync());
    process.on("SIGINT", () => {
      this.cleanup().finally(() => process.exit(0));
    });
    process.on("SIGTERM", () => {
      this.cleanup().finally(() => process.exit(0));
    });
    process.on("uncaughtException", (e) => {
      console.error("[PlaywrightRenderer uncaughtException]", e);
      this.cleanup().finally(() => process.exit(1));
    });
  }

  /**
   * Synchronous cleanup for process 'exit' hook.
   */
  public static cleanupSync(): void {
    for (const server of this.activeServers) {
      try {
        server.close?.().catch?.(() => {});
      } catch {}
    }
    this.activeServers.clear();

    if (this.browserInstance) {
      try {
        (this.browserInstance as any).process?.()?.kill?.("SIGKILL");
      } catch {}
      this.browserInstance = null;
    }
  }

  /**
   * Asynchronous graceful cleanup with hard fallback.
   */
  public static async cleanup(): Promise<void> {
    for (const server of this.activeServers) {
      try {
        await server.close?.().catch(() => {});
        try {
          await (server as any).ssrClose?.().catch(() => {});
        } catch {}
      } catch {}
    }
    this.activeServers.clear();

    if (this.browserInstance) {
      const browser = this.browserInstance;
      this.browserInstance = null;
      try {
        await Promise.race([
          browser.close(),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("Browser close timeout")), 5000)
          ),
        ]);
      } catch {
        try {
          (browser as any).process?.()?.kill?.("SIGKILL");
        } catch {}
      }
    }
  }

  /**
   * Preflight launch verification to fail fast if Chromium is not installed.
   */
  public static async verifyPlaywrightLaunch(timeoutMs = 10000): Promise<{ ok: boolean; error?: string }> {
    try {
      const launchPromise = chromium.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-gpu", "--no-zygote"],
      });

      const browser = await Promise.race([
        launchPromise,
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Chromium launch timed out")), timeoutMs)
        ),
      ]);

      const page = await browser.newPage();
      await page.goto("about:blank", { timeout: 5000 });
      await page.close().catch(() => {});
      await browser.close().catch(() => {});
      return { ok: true };
    } catch (err: any) {
      const msg = err?.message || String(err);
      return {
        ok: false,
        error: `Chromium not found or failed to launch headlessly (${msg}). Please run: npx playwright install chromium`,
      };
    }
  }

  /**
   * Lazily initializes and reuses a Chromium browser instance with a 15-second fail-fast timeout.
   */
  public static async getBrowser(): Promise<Browser> {
    this.registerProcessHandlers();

    if (!this.browserInstance || !this.browserInstance.isConnected()) {
      const launchPromise = chromium.launch({
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

      try {
        this.browserInstance = await Promise.race([
          launchPromise,
          new Promise<never>((_, reject) =>
            setTimeout(
              () =>
                reject(
                  new Error("Chromium not found — run npx playwright install chromium")
                ),
              15000
            )
          ),
        ]);
      } catch (err: any) {
        if (
          err.message?.includes("Chromium not found") ||
          err.message?.includes("Executable doesn't exist") ||
          err.message?.includes("timed out")
        ) {
          throw new Error("Chromium not found — run npx playwright install chromium");
        }
        throw err;
      }
    }
    return this.browserInstance;
  }

  /**
   * Closes the global browser instance if open.
   */
  public static async closeBrowser(): Promise<void> {
    await this.cleanup();
  }

  /**
   * Executes and renders a GeneratedProject inside an isolated sandbox and captures screenshot + DOM layout.
   */
  public static async render(
    project: GeneratedProject,
    options: RenderOptions
  ): Promise<RenderResult> {
    this.registerProcessHandlers();
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

      const vitePromise = (async () => {
        const server = await createServer({
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

        await server.listen();
        return server;
      })();

      viteServer = await Promise.race([
        vitePromise,
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error("Vite dev server launch timed out after 15s")),
            15000
          )
        ),
      ]);

      this.activeServers.add(viteServer);

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

      // 6. Extract DOM element facts for all tagged AIUI IDs and elements
      const boundingBoxes = await page.evaluate(() => {
        const elements = document.querySelectorAll("[data-aiui-id], [id]");
        const seen = new Set<string>();
        const boxes: Array<{
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
        }> = [];

        elements.forEach((el) => {
          const aiuiId = el.getAttribute("data-aiui-id") || el.id;
          if (!aiuiId || seen.has(aiuiId)) return;
          seen.add(aiuiId);

          const rect = el.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            const cs = window.getComputedStyle(el);

            let depth = 0;
            let p: Element | null = el.parentElement;
            while (p) {
              depth++;
              p = p.parentElement;
            }

            boxes.push({
              id: aiuiId,
              dataAiuiId: el.getAttribute("data-aiui-id") || undefined,
              tag: el.tagName.toUpperCase(),
              x: Math.round(rect.left),
              y: Math.round(rect.top),
              width: Math.round(rect.width),
              height: Math.round(rect.height),
              computedStyles: {
                backgroundColor: cs.backgroundColor,
                color: cs.color,
                fontFamily: cs.fontFamily,
                fontSize: cs.fontSize,
                fontWeight: cs.fontWeight,
                lineHeight: cs.lineHeight,
                border: cs.border,
                borderRadius: cs.borderRadius,
                padding: `${cs.paddingTop} ${cs.paddingRight} ${cs.paddingBottom} ${cs.paddingLeft}`,
                margin: `${cs.marginTop} ${cs.marginRight} ${cs.marginBottom} ${cs.marginLeft}`,
                display: cs.display,
                opacity: cs.opacity,
                position: cs.position,
                zIndex: cs.zIndex,
              },
              depth,
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
        this.activeServers.delete(viteServer);
        await viteServer.close().catch(() => {});
        try {
          await (viteServer as any).ssrClose?.().catch(() => {});
        } catch {}
      }
    }
  }
}

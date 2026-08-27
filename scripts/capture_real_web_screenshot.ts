import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

async function capture() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 1,
  });

  const page = await context.newPage();
  
  // Navigate to a clean, modern UI site (e.g. Vite or React official site)
  console.log("Navigating to https://vite.dev ...");
  try {
    await page.goto("https://vite.dev", { waitUntil: "networkidle", timeout: 20000 });
  } catch {
    console.log("Fallback navigation with domcontentloaded...");
    await page.goto("https://vite.dev", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
  }

  const outDir = path.resolve(process.cwd(), "scratch");
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const outPath = path.join(outDir, "live_sample_ui.png");
  await page.screenshot({ path: outPath });
  console.log(`Saved screenshot to ${outPath}`);

  await browser.close();
}

capture().catch(console.error);

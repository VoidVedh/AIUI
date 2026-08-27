import fs from "node:fs";
import path from "node:path";
import "dotenv/config";
import { PipelineOrchestrator, OpenRouterProvider } from "@aiui/orchestrator";
import { createServer } from "vite";
import react from "@vitejs/plugin-react";

async function main() {
  const imageArg = process.argv[2];
  if (!imageArg) {
    console.log("\nUsage:");
    console.log("  npx tsx scripts/run_screenshot.ts <path-to-screenshot-png-or-jpg>\n");
    console.log("Example:");
    console.log("  npx tsx scripts/run_screenshot.ts my-screenshot.png\n");
    process.exit(1);
  }

  const imagePath = path.resolve(process.cwd(), imageArg);
  if (!fs.existsSync(imagePath)) {
    console.error(`\nError: Image file not found at '${imagePath}'\n`);
    process.exit(1);
  }

  const ext = path.extname(imagePath).toLowerCase();
  const mimeType = ext === ".jpg" || ext === ".jpeg" ? "image/jpeg" : "image/png";
  const imageBuffer = fs.readFileSync(imagePath);
  const baseName = path.basename(imagePath, ext);
  const runId = `run_${baseName}_${Date.now()}`;

  console.log("\n===============================================================");
  console.log(`AIUI — AUTONOMOUS SCREENSHOT-TO-REACT PIPELINE`);
  console.log("===============================================================\n");
  console.log(`Input Image: ${imagePath}`);
  console.log(`Run ID:      ${runId}`);
  console.log(`Provider:    OpenRouter Live Vision (Model: ${process.env.OPENROUTER_MODEL || "openrouter/free"})\n`);

  process.env.STRICT_LIVE_VLM = "true";
  const provider = new OpenRouterProvider(undefined, undefined, false);
  const orchestrator = new PipelineOrchestrator(undefined, provider);

  console.log("Starting visual perception, React code generation & self-correction loop...\n");

  const state = await orchestrator.run(imageBuffer, mimeType, {
    runId,
    fixtureName: baseName,
    target: "react",
    viewport: { width: 1280, height: 800 },
    maxIterations: 5,
    similarityThreshold: 0.92,
    onProgress: (_st, log) => {
      console.log(`[PROGRESS] ${log}`);
    },
  });

  console.log(`\n===============================================================`);
  console.log(`PIPELINE EXECUTION COMPLETE`);
  console.log(`===============================================================`);
  console.log(`Final Similarity Score: ${(state.similarityScore * 100).toFixed(1)}%`);
  console.log(`Best Iteration:         ${state.bestIteration} of ${state.totalIterations}`);
  console.log(`Tokens Used:            ${state.totalTokensIn} in / ${state.totalTokensOut} out`);
  console.log(`Cost:                   $${state.totalCostUsd.toFixed(6)}`);

  const bestSandbox = path.resolve(process.cwd(), `runs/${runId}/sandbox_iter_${state.bestIteration}`);
  console.log(`\nGenerated React Code Saved At:`);
  console.log(`  ${bestSandbox}`);

  console.log(`\nStarting live interactive preview server...`);

  const server = await createServer({
    root: bestSandbox,
    configFile: false,
    plugins: [react()],
    resolve: {
      alias: [
        { find: "react", replacement: path.resolve(process.cwd(), "node_modules/react") },
        { find: "react-dom", replacement: path.resolve(process.cwd(), "node_modules/react-dom") },
        { find: "lucide-react", replacement: path.resolve(process.cwd(), "node_modules/lucide-react") },
      ],
    },
    server: {
      port: 3000,
      host: "0.0.0.0",
    },
  });

  await server.listen();
  const address = server.httpServer?.address();
  const port = typeof address === "object" && address ? address.port : 3000;

  console.log(`\n🚀 UI is running live at: http://localhost:${port}/`);
  console.log(`Open http://localhost:${port}/ in your browser to view and interact with the generated React app.\n`);
}

main().catch((err) => {
  console.error("Pipeline failed:", err);
  process.exit(1);
});

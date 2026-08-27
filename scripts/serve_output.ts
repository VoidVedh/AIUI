import path from "node:path";
import fs from "node:fs";
import { createServer } from "vite";
import react from "@vitejs/plugin-react";

async function startServer() {
  const targetDir = process.argv[2] || "runs/live_bench_ugeek-signin_1787827248266/sandbox_iter_3";
  const absPath = path.resolve(process.cwd(), targetDir);

  if (!fs.existsSync(absPath)) {
    console.error(`Target directory not found: ${absPath}`);
    process.exit(1);
  }

  console.log(`\n===============================================================`);
  console.log(`AIUI — SERVING GENERATED REACT OUTPUT`);
  console.log(`===============================================================`);
  console.log(`Serving from: ${absPath}`);

  const server = await createServer({
    root: absPath,
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
  const actualPort = typeof address === "object" && address ? address.port : 3000;
  console.log(`\n🚀 Application is running live at: http://localhost:${actualPort}/`);
  console.log(`Open http://localhost:${actualPort}/ in your browser to view and interact with the UI.\n`);
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});

import path from "node:path";
import fs from "node:fs";
import { createServer } from "vite";
import react from "@vitejs/plugin-react";

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

async function serve() {
  const monoRoot = findMonorepoRoot();
  const appDir = path.resolve(monoRoot, "scratch/demo_output/generated_code");
  const reactPkg = path.resolve(monoRoot, "node_modules/react");
  const reactDomPkg = path.resolve(monoRoot, "node_modules/react-dom");
  const lucidePkg = path.resolve(monoRoot, "node_modules/lucide-react");

  console.log(`Starting Vite server for generated React application at: ${appDir}`);

  const server = await createServer({
    root: appDir,
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
      port: 5050,
      host: "127.0.0.1",
      strictPort: true,
      open: true,
      fs: {
        strict: false,
        allow: [monoRoot, appDir],
      },
    },
  });

  await server.listen();
  console.log(`\n✅ Generated React App is live at: http://127.0.0.1:5050`);
}

serve().catch(console.error);

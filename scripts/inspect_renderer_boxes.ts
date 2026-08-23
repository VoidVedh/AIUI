import { PlaywrightRenderer } from "@aiui/runner";
import { GeneratedProject } from "@aiui/core";
import fs from "node:fs";
import path from "node:path";

async function inspectRendererBoxes() {
  const project: GeneratedProject = {
    target: "react",
    entrypoint: "src/main.jsx",
    files: [
      { path: "package.json", content: fs.readFileSync(path.resolve(process.cwd(), "runs/bench_dashboard/sandbox_iter_1/package.json"), "utf-8") },
      { path: "vite.config.js", content: fs.readFileSync(path.resolve(process.cwd(), "runs/bench_dashboard/sandbox_iter_1/vite.config.js"), "utf-8") },
      { path: "index.html", content: fs.readFileSync(path.resolve(process.cwd(), "runs/bench_dashboard/sandbox_iter_1/index.html"), "utf-8") },
      { path: "src/index.css", content: fs.readFileSync(path.resolve(process.cwd(), "runs/bench_dashboard/sandbox_iter_1/src/index.css"), "utf-8") },
      { path: "src/main.jsx", content: fs.readFileSync(path.resolve(process.cwd(), "runs/bench_dashboard/sandbox_iter_1/src/main.jsx"), "utf-8") },
      { path: "src/App.jsx", content: fs.readFileSync(path.resolve(process.cwd(), "runs/bench_dashboard/sandbox_iter_1/src/App.jsx"), "utf-8") },
    ],
  };

  // Add components
  const compDir = path.resolve(process.cwd(), "runs/bench_dashboard/sandbox_iter_1/src/components");
  if (fs.existsSync(compDir)) {
    for (const file of fs.readdirSync(compDir)) {
      project.files.push({
        path: `src/components/${file}`,
        content: fs.readFileSync(path.join(compDir, file), "utf-8"),
      });
    }
  }

  const renderer = new PlaywrightRenderer();
  const res = await renderer.renderProject(project, { width: 1280, height: 800 }, 30000);
  console.log("Renderer bounding boxes:", res.boundingBoxes.length, res.boundingBoxes);
}

inspectRendererBoxes().catch(console.error);

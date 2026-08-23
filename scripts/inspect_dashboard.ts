import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

async function inspectDashboard() {
  const target = fs.readFileSync(path.resolve(process.cwd(), "fixtures/dashboard/target.png"));
  const rendered = fs.readFileSync(path.resolve(process.cwd(), "runs/bench_dashboard/artifacts/rendered_iter_1.png"));

  const targetMeta = await sharp(target).metadata();
  const renderedMeta = await sharp(rendered).metadata();
  console.log("Target meta:", targetMeta.width, "x", targetMeta.height);
  console.log("Rendered meta:", renderedMeta.width, "x", renderedMeta.height);

  // Let's check the HTML/CSS generated in runs/bench_dashboard/sandbox_iter_1/src/App.jsx
  const appJsx = fs.readFileSync(path.resolve(process.cwd(), "runs/bench_dashboard/sandbox_iter_1/src/App.jsx"), "utf-8");
  console.log("App.jsx:\n", appJsx);

  const indexCss = fs.readFileSync(path.resolve(process.cwd(), "runs/bench_dashboard/sandbox_iter_1/src/index.css"), "utf-8");
  console.log("index.css:\n", indexCss.substring(0, 400));
}

inspectDashboard().catch(console.error);

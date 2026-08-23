import fs from "node:fs";
import path from "node:path";
import { VisualEvaluator, LayoutDiffCalculator } from "@aiui/evaluator";

async function verify() {
  const target = fs.readFileSync(path.resolve(process.cwd(), "fixtures/landing-page/target.png"));
  const rendered = fs.readFileSync(path.resolve(process.cwd(), "runs/bench_landing-page/artifacts/rendered_iter_1.png"));

  const expBoxes = [
    { id: "sec_0_navbar", x: 0, y: 0, width: 1280, height: 72, hasExplicitPosition: false },
    { id: "sec_1_hero", x: 0, y: 0, width: 1280, height: 400, hasExplicitPosition: false },
    { id: "sec_2_card-grid", x: 0, y: 0, width: 1280, height: 300, hasExplicitPosition: false },
  ];
  const actBoxes = [
    { id: "sec_0_navbar", x: 0, y: 0, width: 1280, height: 72 },
    { id: "sec_1_hero", x: 0, y: 72, width: 1280, height: 412 },
    { id: "sec_2_card-grid", x: 0, y: 484, width: 1280, height: 280 },
  ];

  const layout = LayoutDiffCalculator.compute(expBoxes, actBoxes);
  console.log("Layout IOU result:", layout.averageIou);

  const evalRes = await VisualEvaluator.evaluate(target, rendered, expBoxes, actBoxes, { width: 1280, height: 800 });
  console.log("Eval result with boxes:", evalRes.overallSimilarity, "passed:", evalRes.passed);
}

verify().catch(console.error);

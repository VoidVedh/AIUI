import fs from "node:fs";
import path from "node:path";
import { LayoutDiffCalculator } from "@aiui/evaluator";

async function testWhy() {
  const state = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), "runs/bench_dashboard/state.json"), "utf-8"));
  const expectedBoxes = Object.values(state.ir.nodes).map((n: any) => ({
    id: n.id,
    x: n.position.x || 0,
    y: n.position.y || 0,
    width: typeof n.dimensions.width === "number" ? n.dimensions.width : 1280,
    height: typeof n.dimensions.height === "number" ? n.dimensions.height : 50,
    hasExplicitPosition: n.position.relativeTo === "viewport" || (n.position.x !== 0 && n.position.y !== 0),
  }));

  // Let's inspect what elements were rendered
  const actualBoxes = [
    { id: "sec_0_navbar", x: 0, y: 0, width: 1280, height: 72 },
    { id: "sec_0_navbar_logo", x: 32, y: 22, width: 140, height: 28 },
    { id: "sec_1_dashboard", x: 0, y: 72, width: 1280, height: 728 },
  ];

  const res = LayoutDiffCalculator.compute(expectedBoxes, actualBoxes);
  console.log("Computed layout result:", res);
}

testWhy().catch(console.error);

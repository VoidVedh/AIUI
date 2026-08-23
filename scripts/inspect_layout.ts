import fs from "node:fs";
import path from "node:path";
import { LayoutDiffCalculator } from "@aiui/evaluator";

async function inspectLayout() {
  const stateJson = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), "runs/bench_dashboard/state.json"), "utf-8"));
  console.log("State history eval:", stateJson.history[0]?.evaluation);

  const ir = stateJson.ir;
  const expectedBoxes = Object.values(ir.nodes).map((n: any) => ({
    id: n.id,
    x: n.position.x || 0,
    y: n.position.y || 0,
    width: typeof n.dimensions.width === "number" ? n.dimensions.width : 1280,
    height: typeof n.dimensions.height === "number" ? n.dimensions.height : 50,
    hasExplicitPosition: n.position.relativeTo === "viewport" || (n.position.x !== 0 && n.position.y !== 0),
  }));

  console.log("Expected boxes count:", expectedBoxes.length);
  console.log("Expected boxes sample:", expectedBoxes.slice(0, 5));
}

inspectLayout().catch(console.error);

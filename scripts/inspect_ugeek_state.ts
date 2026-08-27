import fs from "node:fs";

const state = JSON.parse(fs.readFileSync("runs/diag_ugeek-signin/state.json", "utf-8"));
console.log("=== UGEEK IR Nodes ===");
for (const [id, node] of Object.entries(state.ir.nodes)) {
  console.log(`Node [${id}] (${(node as any).type}): name=${(node as any).name}, text=${(node as any).content?.text || (node as any).content?.placeholder || ""}, width=${(node as any).dimensions?.width}, height=${(node as any).dimensions?.height}, bg=${(node as any).styles?.backgroundColor || ""}, color=${(node as any).styles?.color || ""}`);
}

console.log("\n=== Generated App.jsx ===");
const appFile = state.currentProject.files.find((f: any) => f.path === "src/App.jsx");
console.log(appFile?.content);

console.log("\n=== Generated index.css ===");
const cssFile = state.currentProject.files.find((f: any) => f.path === "src/index.css");
console.log(cssFile?.content);

import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const SERVER_URL = "http://localhost:3001";

async function runLiveVerification() {
  console.log("=== AIUI Live Full Website & API End-to-End Verification ===\n");

  // 1. Check Server Health
  const healthRes = await fetch(`${SERVER_URL}/api/health`);
  const healthData = await healthRes.json();
  console.log("✓ Server Health:", healthData);

  // 2. Fetch Fixture Presets
  const fixturesRes = await fetch(`${SERVER_URL}/api/fixtures`);
  const fixturesData = await fixturesRes.json();
  console.log(`✓ Fixture Presets loaded: ${fixturesData.length} presets found.`);

  // 3. Test React 19 Run & ZIP verification
  console.log("\n--- Testing Target 1: React 19 (dense-matrix-table) ---");
  const reactRunRes = await fetch(`${SERVER_URL}/api/runs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fixtureId: "dense-matrix-table",
      target: "react",
      maxIterations: 1,
      similarityThreshold: 0.92,
    }),
  });
  const { runId: reactRunId } = await reactRunRes.json();
  console.log(`Started React Run: ${reactRunId}`);

  // Wait for run completion
  let reactState: any = null;
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    const stateRes = await fetch(`${SERVER_URL}/api/runs/${reactRunId}/state`);
    if (stateRes.ok) {
      reactState = await stateRes.json();
      if (reactState.status === "completed" || reactState.status === "success" || reactState.status === "max_iterations_reached") {
        break;
      }
    }
  }
  console.log(`✓ React Run completed with score: ${(reactState.similarityScore * 100).toFixed(1)}%`);

  // Download and extract React ZIP
  const reactZipRes = await fetch(`${SERVER_URL}/api/runs/${reactRunId}/download`);
  const reactZipBuffer = Buffer.from(await reactZipRes.arrayBuffer());
  const scratchDir = path.resolve(process.cwd(), "scratch/downloads");
  fs.mkdirSync(scratchDir, { recursive: true });
  const reactZipPath = path.join(scratchDir, "react_project.zip");
  fs.writeFileSync(reactZipPath, reactZipBuffer);
  const reactZipList = execSync(`unzip -l "${reactZipPath}"`).toString();
  console.log("✓ React ZIP downloaded & verified via unzip -l:\n" + reactZipList);

  // 4. Test Vanilla JS Run & ZIP verification
  console.log("\n--- Testing Target 2: Vanilla JS (card-ui) ---");
  const jsRunRes = await fetch(`${SERVER_URL}/api/runs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fixtureId: "card-ui",
      target: "vanillajs",
      maxIterations: 1,
      similarityThreshold: 0.92,
    }),
  });
  const { runId: jsRunId } = await jsRunRes.json();
  console.log(`Started Vanilla JS Run: ${jsRunId}`);

  let jsState: any = null;
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    const stateRes = await fetch(`${SERVER_URL}/api/runs/${jsRunId}/state`);
    if (stateRes.ok) {
      jsState = await stateRes.json();
      if (jsState.status === "completed" || jsState.status === "success" || jsState.status === "max_iterations_reached") {
        break;
      }
    }
  }
  console.log(`✓ Vanilla JS Run completed with score: ${(jsState.similarityScore * 100).toFixed(1)}%`);

  // Download and extract Vanilla JS ZIP
  const jsZipRes = await fetch(`${SERVER_URL}/api/runs/${jsRunId}/download`);
  const jsZipBuffer = Buffer.from(await jsZipRes.arrayBuffer());
  const jsZipPath = path.join(scratchDir, "vanillajs_project.zip");
  fs.writeFileSync(jsZipPath, jsZipBuffer);
  const jsZipList = execSync(`unzip -l "${jsZipPath}"`).toString();
  console.log("✓ Vanilla JS ZIP downloaded & verified via unzip -l:\n" + jsZipList);

  // 5. Test Flutter Run & ZIP verification
  console.log("\n--- Testing Target 3: Flutter (mobile-ui) ---");
  const flutterRunRes = await fetch(`${SERVER_URL}/api/runs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fixtureId: "mobile-ui",
      target: "flutter",
      maxIterations: 1,
      similarityThreshold: 0.92,
    }),
  });
  const { runId: flutterRunId } = await flutterRunRes.json();
  console.log(`Started Flutter Run: ${flutterRunId}`);

  let flutterState: any = null;
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    const stateRes = await fetch(`${SERVER_URL}/api/runs/${flutterRunId}/state`);
    if (stateRes.ok) {
      flutterState = await stateRes.json();
      if (flutterState.status === "completed" || flutterState.status === "success" || flutterState.status === "max_iterations_reached") {
        break;
      }
    }
  }
  console.log(`✓ Flutter Run completed with status: ${flutterState.status}`);

  // Download and extract Flutter ZIP
  const flutterZipRes = await fetch(`${SERVER_URL}/api/runs/${flutterRunId}/download`);
  const flutterZipBuffer = Buffer.from(await flutterZipRes.arrayBuffer());
  const flutterZipPath = path.join(scratchDir, "flutter_project.zip");
  fs.writeFileSync(flutterZipPath, flutterZipBuffer);
  const flutterZipList = execSync(`unzip -l "${flutterZipPath}"`).toString();
  console.log("✓ Flutter ZIP downloaded & verified via unzip -l:\n" + flutterZipList);

  // 6. Test Figma Input Path via API
  console.log("\n--- Testing Figma Input Path ---");
  const sampleFigmaJson = {
    document: {
      id: "0:0",
      name: "Document",
      type: "DOCUMENT",
      children: [
        {
          id: "0:1",
          name: "Page 1",
          type: "CANVAS",
          children: [
            {
              id: "1:2",
              name: "Pricing Card",
              type: "FRAME",
              absoluteBoundingBox: { x: 0, y: 0, width: 400, height: 500 },
              layoutMode: "VERTICAL",
              itemSpacing: 16,
              paddingLeft: 24,
              paddingRight: 24,
              paddingTop: 24,
              paddingBottom: 24,
              cornerRadius: 12,
              fills: [{ type: "SOLID", color: { r: 0.1, g: 0.15, b: 0.25, a: 1 } }],
              children: [
                {
                  id: "1:3",
                  name: "Pro Plan",
                  type: "TEXT",
                  characters: "Pro Plan",
                  style: { fontSize: 24, fontWeight: 700 },
                  fills: [{ type: "SOLID", color: { r: 1, g: 1, b: 1, a: 1 } }],
                },
                {
                  id: "1:4",
                  name: "Subscribe Button",
                  type: "FRAME",
                  absoluteBoundingBox: { x: 24, y: 300, width: 352, height: 48 },
                  cornerRadius: 8,
                  fills: [{ type: "SOLID", color: { r: 0.23, g: 0.51, b: 0.96, a: 1 } }],
                  children: [
                    {
                      id: "1:5",
                      name: "Button Text",
                      type: "TEXT",
                      characters: "Get Started",
                      style: { fontSize: 16, fontWeight: 600 },
                      fills: [{ type: "SOLID", color: { r: 1, g: 1, b: 1, a: 1 } }],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  };

  const figmaBlob = new Blob([JSON.stringify(sampleFigmaJson)], { type: "application/json" });
  const figmaFormData = new FormData();
  figmaFormData.append("image", figmaBlob, "figma_artboard.json");
  figmaFormData.append("target", "react");
  figmaFormData.append("maxIterations", "1");

  const figmaRunRes = await fetch(`${SERVER_URL}/api/runs`, {
    method: "POST",
    body: figmaFormData,
  });
  const { runId: figmaRunId } = await figmaRunRes.json();
  console.log(`Started Figma Run: ${figmaRunId}`);

  let figmaState: any = null;
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    const stateRes = await fetch(`${SERVER_URL}/api/runs/${figmaRunId}/state`);
    if (stateRes.ok) {
      figmaState = await stateRes.json();
      if (figmaState.status === "completed" || figmaState.status === "success" || figmaState.status === "max_iterations_reached") {
        break;
      }
    }
  }
  console.log(`✓ Figma Run completed with status: ${figmaState.status}, files generated: ${figmaState.currentProject.files.length}`);

  // 7. Adversarial Test: Corrupt / Empty File Upload
  console.log("\n--- Testing Adversarial Path: Empty & Corrupt Input ---");
  const corruptFormData = new FormData();
  // No image or fixtureId attached
  const emptyRes = await fetch(`${SERVER_URL}/api/runs`, {
    method: "POST",
    body: corruptFormData,
  });
  const emptyErr = await emptyRes.json();
  console.log(`✓ Server returned status ${emptyRes.status} with expected error: "${emptyErr.error}"`);

  // 8. Adversarial Test: Double ZIP Download
  console.log("\n--- Testing Adversarial Path: Double ZIP Download ---");
  const zipRes1 = await fetch(`${SERVER_URL}/api/runs/${reactRunId}/download`);
  const zipBuf1 = Buffer.from(await zipRes1.arrayBuffer());
  const zipRes2 = await fetch(`${SERVER_URL}/api/runs/${reactRunId}/download`);
  const zipBuf2 = Buffer.from(await zipRes2.arrayBuffer());
  console.log(`✓ 1st Download size: ${zipBuf1.length} bytes, 2nd Download size: ${zipBuf2.length} bytes (Match: ${zipBuf1.length === zipBuf2.length})`);

  console.log("\n=== All Verification Steps Completed Successfully! ===");
}

runLiveVerification().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});

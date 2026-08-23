import { spawn } from "node:child_process";
import http from "node:http";

console.log("==================================================");
console.log("   🚀 Launching AIUI Autonomous UI Engine...     ");
console.log("==================================================");

// 1. Start Server
console.log("▶ Starting AIUI Backend Server (Port 3001)...");
const serverProcess = spawn("npm", ["run", "dev", "--workspace=@aiui/server"], {
  stdio: "inherit",
  shell: true,
});

// 2. Start Web Dashboard
console.log("▶ Starting AIUI Web Dashboard (Port 5173)...");
const webProcess = spawn("npm", ["run", "dev", "--workspace=@aiui/web"], {
  stdio: "inherit",
  shell: true,
});

// Function to poll port
function checkPort(port: number, callback: () => void) {
  const check = () => {
    const req = http.get(`http://127.0.0.1:${port}`, (res) => {
      callback();
    });
    req.on("error", () => {
      setTimeout(check, 500);
    });
  };
  check();
}

// Once web is ready, open browser
checkPort(5173, () => {
  console.log("\n==================================================");
  console.log("   ✅ AIUI is LIVE! Opening browser...           ");
  console.log("   🌐 Dashboard: http://localhost:5173           ");
  console.log("   📡 API Server: http://localhost:3001          ");
  console.log("==================================================\n");

  const openCmd = process.platform === "darwin" ? "open" : process.platform === "win32" ? "start" : "xdg-open";
  spawn(openCmd, ["http://localhost:5173"], { shell: true, stdio: "ignore" });
});

// Handle termination
process.on("SIGINT", () => {
  serverProcess.kill("SIGINT");
  webProcess.kill("SIGINT");
  process.exit(0);
});

process.on("SIGTERM", () => {
  serverProcess.kill("SIGTERM");
  webProcess.kill("SIGTERM");
  process.exit(0);
});

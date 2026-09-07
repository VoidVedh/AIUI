import { spawn, execSync } from "node:child_process";
import http from "node:http";

console.log("==================================================");
console.log("   🚀 Launching AIUI Autonomous UI Engine...     ");
console.log("==================================================");

// 1. Start Server in detached process group
console.log("▶ Starting AIUI Backend Server (Port 3001)...");
const serverProcess = spawn("npm", ["run", "dev", "--workspace=@aiui/server"], {
  stdio: "inherit",
  shell: true,
  detached: true,
});

// 2. Start Web Dashboard in detached process group
console.log("▶ Starting AIUI Web Dashboard (Port 5173)...");
const webProcess = spawn("npm", ["run", "dev", "--workspace=@aiui/web"], {
  stdio: "inherit",
  shell: true,
  detached: true,
});

// Function to poll port
function checkPort(port: number, callback: () => void) {
  let attempts = 0;
  const maxAttempts = 60;
  const check = () => {
    attempts++;
    const req = http.get(`http://127.0.0.1:${port}`, (_res) => {
      callback();
    });
    req.on("error", () => {
      if (attempts < maxAttempts) {
        setTimeout(check, 500);
      }
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

function cleanupAndExit(code = 0) {
  console.log("\n[start_all] Shutting down all processes...");

  // Kill entire process groups
  if (serverProcess.pid) {
    try {
      process.kill(-serverProcess.pid, "SIGKILL");
    } catch {}
  }
  if (webProcess.pid) {
    try {
      process.kill(-webProcess.pid, "SIGKILL");
    } catch {}
  }

  // Double check and free ports 3001 and 5173
  try {
    const lsof = execSync("lsof -t -i :3001 -i :5173 2>/dev/null", { encoding: "utf-8" }).trim();
    if (lsof) {
      const pids = lsof.split(/\s+/).filter(Boolean);
      for (const pid of pids) {
        try {
          process.kill(Number(pid), "SIGKILL");
        } catch {}
      }
    }
  } catch {}

  process.exit(code);
}

process.on("SIGINT", () => cleanupAndExit(0));
process.on("SIGTERM", () => cleanupAndExit(0));
process.on("uncaughtException", (err) => {
  console.error("[start_all uncaughtException]", err);
  cleanupAndExit(1);
});

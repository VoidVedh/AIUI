import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const FIXTURES = [
  {
    name: "landing-page",
    title: "Landing Page",
    width: 1280,
    height: 800,
    html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', sans-serif; background: #0f172a; color: #f8fafc; min-height: 100vh; display: flex; flex-direction: column; }
    nav { height: 72px; padding: 0 32px; display: flex; justify-content: space-between; align-items: center; background: #1e293b; border-bottom: 1px solid #334155; }
    .logo { font-size: 20px; font-weight: 700; color: #f8fafc; letter-spacing: -0.02em; }
    .nav-links { display: flex; gap: 28px; font-size: 14px; color: #94a3b8; font-weight: 500; }
    .cta-btn { background: #3b82f6; color: white; padding: 8px 18px; border-radius: 8px; font-weight: 600; font-size: 14px; border: none; }
    .hero { padding: 80px 24px 60px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 16px; }
    .badge { background: rgba(59,130,246,0.15); color: #3b82f6; font-size: 12px; font-weight: 600; padding: 6px 14px; border-radius: 9999px; border: 1px solid rgba(59,130,246,0.3); }
    h1 { font-size: 44px; font-weight: 800; line-height: 1.15; letter-spacing: -0.03em; max-width: 840px; }
    p.sub { font-size: 18px; color: #94a3b8; max-width: 640px; line-height: 1.6; }
    .hero-ctas { display: flex; gap: 16px; margin-top: 12px; }
    .btn-pri { background: #3b82f6; color: white; padding: 12px 28px; border-radius: 10px; font-weight: 600; font-size: 15px; border: none; }
    .btn-sec { background: rgba(30,41,59,0.8); color: #f8fafc; padding: 12px 24px; border-radius: 10px; font-weight: 600; font-size: 15px; border: 1px solid #334155; }
    .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; max-width: 1140px; margin: 40px auto 60px; padding: 0 24px; width: 100%; }
    .card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 28px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
    .card h3 { font-size: 18px; font-weight: 600; margin-bottom: 8px; }
    .card p { font-size: 14px; color: #94a3b8; line-height: 1.5; }
  </style>
</head>
<body>
  <nav>
    <div class="logo">AIUI Autonomous Engine</div>
    <div class="nav-links"><span>Features</span><span>Solutions</span><span>Pricing</span></div>
    <button class="cta-btn">Get Started</button>
  </nav>
  <div class="hero">
    <div class="badge">✦ Next-Gen Autonomous UI Engineering</div>
    <h1>Transform Screenshots Into Pixel-Perfect Production Code</h1>
    <p class="sub">AIUI autonomously analyzes UI design, extracts design tokens, builds component trees, and self-corrects using computer vision.</p>
    <div class="hero-ctas">
      <button class="btn-pri">Start Building Now</button>
      <button class="btn-sec">View Documentation</button>
    </div>
  </div>
  <div class="grid">
    <div class="card"><h3>Structured UI IR</h3><p>Framework-agnostic intermediate language isolating vision perception from code output.</p></div>
    <div class="card"><h3>Multi-Target Generators</h3><p>Synthesizes idiomatic React 19, Vanilla JS, and Flutter from a single analyzed tree.</p></div>
    <div class="card"><h3>Self-Correction Loop</h3><p>Calculates real SSIM and pixelmatch metrics with targeted surgical CSS/JSX patch engine.</p></div>
  </div>
</body>
</html>`
  },
  {
    name: "dashboard",
    title: "Analytics Dashboard",
    width: 1280,
    height: 800,
    html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', sans-serif; background: #0f172a; color: #f8fafc; min-height: 100vh; display: flex; flex-direction: column; }
    nav { height: 72px; padding: 0 32px; display: flex; justify-content: space-between; align-items: center; background: #1e293b; border-bottom: 1px solid #334155; }
    .logo { font-size: 20px; font-weight: 700; color: #f8fafc; }
    .dash-layout { display: flex; flex: 1; }
    .sidebar { width: 240px; background: #1e293b; border-right: 1px solid #334155; padding: 24px 16px; display: flex; flex-direction: column; gap: 8px; }
    .nav-btn { padding: 8px 12px; border-radius: 6px; font-size: 14px; font-weight: 500; color: #94a3b8; text-align: left; background: none; border: none; }
    .nav-btn.active { background: rgba(59,130,246,0.15); color: #3b82f6; font-weight: 600; }
    .main { flex: 1; padding: 28px; display: flex; flex-direction: column; gap: 24px; }
    .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
    .stat-card { background: #1e293b; border: 1px solid #334155; border-radius: 10px; padding: 20px; display: flex; flex-direction: column; gap: 6px; }
    .stat-lbl { font-size: 13px; color: #94a3b8; }
    .stat-val { font-size: 24px; font-weight: 700; }
    .stat-diff { font-size: 12px; color: #10b981; font-weight: 600; }
    .chart-card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 24px; height: 320px; display: flex; flex-direction: column; gap: 16px; }
    .chart-hdr { font-size: 16px; font-weight: 600; }
    .chart-body { flex: 1; background: rgba(15,23,42,0.6); border-radius: 8px; }
  </style>
</head>
<body>
  <nav><div class="logo">AIUI Analytics</div><button style="background:#3b82f6;color:white;padding:8px 18px;border-radius:8px;font-weight:600;border:none;">Export Data</button></nav>
  <div class="dash-layout">
    <div class="sidebar">
      <button class="nav-btn active">Overview</button>
      <button class="nav-btn">Analytics</button>
      <button class="nav-btn">Reports</button>
      <button class="nav-btn">Settings</button>
    </div>
    <div class="main">
      <div class="stats">
        <div class="stat-card"><div class="stat-lbl">Total Revenue</div><div class="stat-val">$124,500</div><div class="stat-diff">+14.2%</div></div>
        <div class="stat-card"><div class="stat-lbl">Active Pipelines</div><div class="stat-val">842</div><div class="stat-diff">+8.7%</div></div>
        <div class="stat-card"><div class="stat-lbl">Avg Similarity Score</div><div class="stat-val">94.6%</div><div class="stat-diff">+3.1%</div></div>
      </div>
      <div class="chart-card">
        <div class="chart-hdr">Performance Convergence Analytics</div>
        <div class="chart-body"></div>
      </div>
    </div>
  </div>
</body>
</html>`
  },
  {
    name: "form-ui",
    title: "Registration Form",
    width: 1280,
    height: 800,
    html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', sans-serif; background: #0f172a; color: #f8fafc; min-height: 100vh; display: flex; flex-direction: column; }
    nav { height: 72px; padding: 0 32px; display: flex; justify-content: space-between; align-items: center; background: #1e293b; border-bottom: 1px solid #334155; }
    .form-wrap { flex: 1; display: flex; justify-content: center; align-items: center; padding: 40px 24px; }
    .card { background: #1e293b; border: 1px solid #334155; border-radius: 16px; padding: 36px 32px; width: 100%; max-width: 440px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.3); display: flex; flex-direction: column; gap: 18px; }
    h2 { font-size: 24px; font-weight: 700; }
    p.sub { font-size: 14px; color: #94a3b8; }
    form { display: flex; flex-direction: column; gap: 14px; }
    input { background: #0f172a; border: 1px solid #334155; border-radius: 8px; padding: 10px 14px; color: #f8fafc; font-size: 14px; height: 44px; width: 100%; }
    .btn-submit { background: #3b82f6; color: white; border-radius: 8px; padding: 10px 20px; font-weight: 600; font-size: 15px; border: none; height: 44px; margin-top: 6px; cursor: pointer; }
  </style>
</head>
<body>
  <nav><div style="font-size:20px;font-weight:700;">AIUI Platform</div><button style="background:#3b82f6;color:white;padding:8px 18px;border-radius:8px;border:none;font-weight:600;">Sign In</button></nav>
  <div class="form-wrap">
    <div class="card">
      <h2>Create Your Account</h2>
      <p class="sub">Join thousands of developers using AIUI.</p>
      <form>
        <input type="text" placeholder="Full Name" />
        <input type="email" placeholder="Email address" />
        <input type="password" placeholder="Password" />
        <button type="button" class="btn-submit">Sign Up Free</button>
      </form>
    </div>
  </div>
</body>
</html>`
  },
  {
    name: "card-ui",
    title: "Card-Based Pricing",
    width: 1280,
    height: 800,
    html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', sans-serif; background: #0f172a; color: #f8fafc; min-height: 100vh; display: flex; flex-direction: column; }
    nav { height: 72px; padding: 0 32px; display: flex; justify-content: space-between; align-items: center; background: #1e293b; border-bottom: 1px solid #334155; }
    .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; max-width: 1140px; margin: 80px auto; padding: 0 24px; width: 100%; }
    .card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 28px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); display: flex; flex-direction: column; gap: 12px; }
    .card h3 { font-size: 18px; font-weight: 600; }
    .card p { font-size: 14px; color: #94a3b8; line-height: 1.5; }
  </style>
</head>
<body>
  <nav><div style="font-size:20px;font-weight:700;">AIUI Architecture</div><button style="background:#3b82f6;color:white;padding:8px 18px;border-radius:8px;border:none;font-weight:600;">Explore</button></nav>
  <div class="grid">
    <div class="card"><h3>Structured UI IR</h3><p>Framework-agnostic intermediate language isolating vision perception from code output.</p></div>
    <div class="card"><h3>Multi-Target Generators</h3><p>Synthesizes idiomatic React 19, Vanilla JS, and Flutter from a single analyzed tree.</p></div>
    <div class="card"><h3>Self-Correction Loop</h3><p>Calculates real SSIM and pixelmatch metrics with targeted surgical CSS/JSX patch engine.</p></div>
  </div>
</body>
</html>`
  },
  {
    name: "mobile-ui",
    title: "Mobile App Screen",
    width: 390,
    height: 844,
    html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', sans-serif; background: #0f172a; color: #f8fafc; height: 844px; width: 390px; margin: 0 auto; display: flex; flex-direction: column; justify-content: space-between; overflow: hidden; }
    header { height: 56px; background: #1e293b; border-bottom: 1px solid #334155; display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: 700; }
    .content { padding: 20px 16px; display: flex; flex-direction: column; gap: 14px; flex: 1; }
    .mcard { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 18px; display: flex; flex-direction: column; gap: 8px; }
    .mcard h3 { font-size: 15px; font-weight: 600; }
    .mcard p { font-size: 13px; color: #94a3b8; }
    footer { height: 60px; background: #1e293b; border-top: 1px solid #334155; display: flex; justify-content: space-around; align-items: center; font-size: 12px; font-weight: 600; color: #94a3b8; }
    footer .active { color: #3b82f6; }
  </style>
</head>
<body>
  <header>AIUI Mobile</header>
  <div class="content">
    <div class="mcard"><h3>Real-time Pipeline</h3><p>Optimized mobile layout rendered via unified IR.</p></div>
    <div class="mcard"><h3>Self-Healing Engine</h3><p>Optimized mobile layout rendered via unified IR.</p></div>
  </div>
  <footer>
    <span class="active">Home</span>
    <span>Activity</span>
    <span>Profile</span>
  </footer>
</body>
</html>`
  }
];

async function main() {
  const browser = await chromium.launch({ headless: true });

  for (const fix of FIXTURES) {
    const dir = path.resolve(process.cwd(), "fixtures", fix.name);
    fs.mkdirSync(dir, { recursive: true });

    const page = await browser.newPage({
      viewport: { width: fix.width, height: fix.height },
      deviceScaleFactor: 1,
    });

    await page.setContent(fix.html, { waitUntil: "networkidle" });
    await page.waitForTimeout(300);

    const imgPath = path.join(dir, "target.png");
    await page.screenshot({ path: imgPath, type: "png", clip: { x: 0, y: 0, width: fix.width, height: fix.height } });
    await page.close();

    console.log(`Generated fixture screenshot: ${imgPath} (${fix.width}x${fix.height})`);
  }

  await browser.close();
}

main().catch(console.error);

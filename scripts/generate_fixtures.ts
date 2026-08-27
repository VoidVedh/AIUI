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
    <div class="logo">Application Suite</div>
    <div class="nav-links"><span>Features</span><span>Solutions</span><span>Pricing</span></div>
    <button class="cta-btn">Get Started</button>
  </nav>
  <div class="hero">
    <div class="badge">✦ Next-Gen Enterprise Solution</div>
    <h1>Transform Workflows Into Production Results</h1>
    <p class="sub">Seamlessly integrate workflows, manage structured resources, and deploy scalable systems across your organization.</p>
    <div class="hero-ctas">
      <button class="btn-pri">Get Started Free</button>
      <button class="btn-sec">Learn More</button>
    </div>
  </div>
  <div class="grid">
    <div class="card"><h3>Unified System Architecture</h3><p>Isolates component logic from presentation layers for scalable performance.</p></div>
    <div class="card"><h3>Automated Workflows</h3><p>Synthesizes modern responsive UI layouts across platforms with high visual fidelity.</p></div>
    <div class="card"><h3>Continuous Self-Correction</h3><p>Evaluates layout metrics with targeted surgical patches and real-time verification.</p></div>
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
      <h2>Sign In</h2>
      <p class="sub">Please enter your credentials to continue.</p>
      <form>
        <input type="text" placeholder="Full Name" />
        <input type="email" placeholder="Email address" />
        <input type="password" placeholder="Password" />
        <button type="button" class="btn-submit">Sign In</button>
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
    <div class="card"><h3>Unified System Architecture</h3><p>Isolates component logic from presentation layers for scalable performance.</p></div>
    <div class="card"><h3>Automated Workflows</h3><p>Synthesizes modern responsive UI layouts across platforms with high visual fidelity.</p></div>
    <div class="card"><h3>Continuous Self-Correction</h3><p>Evaluates layout metrics with targeted surgical patches and real-time verification.</p></div>
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
  <header>Mobile Hub</header>
  <div class="content">
    <div class="mcard"><h3>Live Operations</h3><p>Optimized mobile layout rendered via unified IR.</p></div>
    <div class="mcard"><h3>Security & Encryption</h3><p>Optimized mobile layout rendered via unified IR.</p></div>
  </div>
  <footer>
    <span class="active">Home</span>
    <span>Activity</span>
    <span>Profile</span>
  </footer>
</body>
</html>`
  },
  {
    name: "dense-matrix-table",
    title: "Dense Pricing & Feature Matrix",
    width: 1280,
    height: 800,
    html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', sans-serif; background: #0b1120; color: #f8fafc; min-height: 100vh; display: flex; flex-direction: column; -webkit-font-smoothing: antialiased; }
    nav { height: 64px; padding: 0 32px; display: flex; justify-content: space-between; align-items: center; background: #0f172a; border-bottom: 1px solid #1e293b; }
    .logo { font-size: 18px; font-weight: 700; color: #f8fafc; letter-spacing: -0.01em; }
    .badge { background: #3b82f6; color: white; font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 4px; text-transform: uppercase; margin-left: 8px; }
    .header-content { text-align: center; padding: 36px 20px 24px; }
    h1 { font-size: 32px; font-weight: 800; letter-spacing: -0.02em; margin-bottom: 8px; }
    p.sub { font-size: 14px; color: #94a3b8; }
    .matrix-wrap { max-width: 1180px; margin: 0 auto 40px; padding: 0 20px; width: 100%; }
    .matrix-grid { display: grid; grid-template-columns: 260px repeat(3, 1fr); background: #0f172a; border: 1px solid #1e293b; border-radius: 12px; overflow: hidden; }
    .cell { padding: 14px 18px; border-bottom: 1px solid #1e293b; border-right: 1px solid #1e293b; font-size: 13px; display: flex; align-items: center; }
    .cell:nth-child(4n) { border-right: none; }
    .row-header { background: #131d33; font-weight: 600; color: #f8fafc; }
    .plan-title { font-size: 16px; font-weight: 700; margin-bottom: 4px; }
    .plan-price { font-size: 22px; font-weight: 800; color: #3b82f6; }
    .plan-sub { font-size: 11px; color: #94a3b8; }
    .tier-featured { background: rgba(59,130,246,0.06); }
    .pill { display: inline-flex; align-items: center; padding: 2px 8px; border-radius: 9999px; font-size: 10px; font-weight: 600; }
    .pill-green { background: rgba(16,185,129,0.15); color: #10b981; }
    .pill-blue { background: rgba(59,130,246,0.15); color: #3b82f6; }
    .btn-plan { width: 100%; padding: 8px; border-radius: 6px; font-size: 13px; font-weight: 600; border: none; cursor: pointer; text-align: center; }
    .btn-pri { background: #3b82f6; color: white; }
    .btn-sec { background: #1e293b; color: #f8fafc; border: 1px solid #334155; }
    .check { color: #10b981; font-weight: 700; }
    .dash { color: #475569; }
    .foot-note { text-align: center; font-size: 12px; color: #64748b; margin-top: 16px; }
  </style>
</head>
<body>
  <nav>
    <div style="display:flex;align-items:center;"><span class="logo">Enterprise Cloud</span><span class="badge">PRO</span></div>
    <div style="font-size:13px;color:#94a3b8;">Feature Comparison Matrix</div>
  </nav>
  <div class="header-content">
    <h1>Compare Plans & Capabilities</h1>
    <p class="sub">Choose the right tier for self-healing UI synthesis and automated visual evaluation.</p>
  </div>
  <div class="matrix-wrap">
    <div class="matrix-grid">
      <!-- Row 1: Plan Headers -->
      <div class="cell row-header" style="flex-direction:column;align-items:flex-start;justify-content:center;">
        <span style="font-weight:700;font-size:14px;">Platform Capabilities</span>
        <span style="font-size:11px;color:#94a3b8;margin-top:2px;">Compare features side-by-side</span>
      </div>
      <div class="cell" style="flex-direction:column;align-items:flex-start;">
        <div class="plan-title">Starter</div>
        <div class="plan-price">$29 <span class="plan-sub">/ mo</span></div>
      </div>
      <div class="cell tier-featured" style="flex-direction:column;align-items:flex-start;">
        <div style="display:flex;justify-content:space-between;width:100%;align-items:center;">
          <div class="plan-title">Professional</div>
          <span class="pill pill-blue">Popular</span>
        </div>
        <div class="plan-price">$99 <span class="plan-sub">/ mo</span></div>
      </div>
      <div class="cell" style="flex-direction:column;align-items:flex-start;">
        <div class="plan-title">Enterprise</div>
        <div class="plan-price">$299 <span class="plan-sub">/ mo</span></div>
      </div>

      <!-- Row 2: Target Frameworks -->
      <div class="cell row-header">Multi-Target Generators</div>
      <div class="cell"><span class="pill pill-green">React 19</span></div>
      <div class="cell tier-featured"><span class="pill pill-green">React + Vanilla JS</span></div>
      <div class="cell"><span class="pill pill-green">React + JS + Flutter</span></div>

      <!-- Row 3: Evaluation -->
      <div class="cell row-header">MSSIM + PixelMatch CV</div>
      <div class="cell"><span class="check">✓ Standard (5 iter)</span></div>
      <div class="cell tier-featured"><span class="check">✓ Subpixel Gaussian</span></div>
      <div class="cell"><span class="check">✓ Ultra-HD Bounding Box</span></div>

      <!-- Row 4: CTAs -->
      <div class="cell row-header" style="border-bottom:none;">Selection</div>
      <div class="cell" style="border-bottom:none;"><button class="btn-plan btn-sec">Choose Starter</button></div>
      <div class="cell tier-featured" style="border-bottom:none;"><button class="btn-plan btn-pri">Upgrade Pro</button></div>
      <div class="cell" style="border-bottom:none;"><button class="btn-plan btn-sec">Contact Sales</button></div>
    </div>
    <div class="foot-note">All tiers include process-level sandboxed execution and automated regression rollback.</div>
  </div>
</body>
</html>`
  },
  {
    name: "ugeek-signin",
    title: "Ugeek B2B Marketplace Sign-In",
    width: 1280,
    height: 800,
    html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', sans-serif; margin: 0; min-height: 100vh; display: flex; }
    .split-left {
      width: 50%;
      background: #0b132b;
      color: #f8fafc;
      padding: 48px 56px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      border-right: 1px solid #1e293b;
    }
    .brand-logo { font-size: 24px; font-weight: 800; color: #f8fafc; letter-spacing: -0.02em; }
    .hero-badge {
      display: inline-block;
      background: rgba(59, 130, 246, 0.15);
      color: #60a5fa;
      font-size: 12px;
      font-weight: 600;
      padding: 4px 12px;
      border-radius: 9999px;
      margin-bottom: 16px;
    }
    .hero-title { font-size: 36px; font-weight: 800; line-height: 1.25; letter-spacing: -0.03em; margin-bottom: 16px; }
    .hero-desc { font-size: 16px; color: #94a3b8; line-height: 1.6; max-width: 480px; margin-bottom: 28px; }
    .hero-list { display: flex; flex-direction: column; gap: 12px; font-size: 14px; color: #f8fafc; }
    .hero-list-item { display: flex; align-items: center; gap: 8px; }
    .check-icon { color: #3b82f6; font-weight: 700; }
    .left-footer { font-size: 13px; color: #64748b; }

    .split-right {
      width: 50%;
      background: #ffffff;
      color: #0f172a;
      padding: 48px 48px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
    }
    .auth-card { width: 100%; max-width: 440px; display: flex; flex-direction: column; gap: 16px; }
    .auth-title { font-size: 28px; font-weight: 700; color: #0f172a; letter-spacing: -0.02em; }
    .auth-sub { font-size: 14px; color: #64748b; margin-top: -6px; margin-bottom: 6px; }
    .btn-google {
      width: 100%;
      height: 44px;
      background: #ffffff;
      color: #1e293b;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      cursor: pointer;
    }
    .divider { display: flex; align-items: center; text-align: center; color: #94a3b8; font-size: 12px; font-weight: 600; }
    .divider::before, .divider::after { content: ''; flex: 1; border-bottom: 1px solid #e2e8f0; }
    .divider:not(:empty)::before { margin-right: 12px; }
    .divider:not(:empty)::after { margin-left: 12px; }
    .form-group { display: flex; flex-direction: column; gap: 6px; }
    .form-label { font-size: 13px; font-weight: 600; color: #0f172a; }
    .form-input {
      width: 100%;
      height: 44px;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 10px 14px;
      font-size: 14px;
      color: #0f172a;
    }
    .auth-row { display: flex; justify-content: space-between; align-items: center; font-size: 13px; color: #64748b; }
    .forgot-link { color: #2563eb; font-weight: 600; text-decoration: none; }
    .btn-signin {
      width: 100%;
      height: 46px;
      background: #2563eb;
      color: #ffffff;
      border: none;
      border-radius: 8px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      margin-top: 4px;
    }
    .auth-footer { font-size: 13px; color: #64748b; text-align: center; margin-top: 8px; }
  </style>
</head>
<body>
  <div class="split-left">
    <div class="brand-logo">Ugeek</div>
    <div class="hero-content">
      <div class="hero-badge">✦ B2B Marketplace Platform</div>
      <div class="hero-title">The platform where businesses buy from and sell to other businesses</div>
      <div class="hero-desc">Connect with verified suppliers, manage bulk purchasing, and streamline commercial workflows in a unified portal.</div>
      <div class="hero-list">
        <div class="hero-list-item"><span class="check-icon">✓</span> Verified commercial vendors & buyer network</div>
        <div class="hero-list-item"><span class="check-icon">✓</span> Instant enterprise quotations & automated invoicing</div>
        <div class="hero-list-item"><span class="check-icon">✓</span> End-to-end transaction security & escrow support</div>
      </div>
    </div>
    <div class="left-footer">© 2026 Ugeek B2B Marketplace. All rights reserved.</div>
  </div>

  <div class="split-right">
    <div class="auth-card">
      <div class="auth-title">Welcome back!</div>
      <div class="auth-sub">Please enter your commercial credentials to sign in.</div>
      <button class="btn-google">G Continue with Google</button>
      <div class="divider">OR</div>
      <div class="form-group">
        <label class="form-label">Email Address</label>
        <input class="form-input" type="email" placeholder="name@company.com" />
      </div>
      <div class="form-group">
        <label class="form-label">Password</label>
        <input class="form-input" type="password" placeholder="••••••••" />
      </div>
      <div class="auth-row">
        <span>Remember me for 30 days</span>
        <a href="#" class="forgot-link">Forgot password?</a>
      </div>
      <button class="btn-signin">Sign In</button>
      <div class="auth-footer">Don't have an account? Contact enterprise sales.</div>
    </div>
  </div>
</body>
</html>`
  },
  {
    name: "checkout-summary",
    title: "Checkout & Invoice Summary",
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
    nav { height: 68px; padding: 0 32px; display: flex; justify-content: space-between; align-items: center; background: #1e293b; border-bottom: 1px solid #334155; }
    .logo { font-size: 18px; font-weight: 700; color: #f8fafc; }
    .content-wrap { max-width: 1100px; margin: 40px auto; padding: 0 24px; width: 100%; display: grid; grid-template-columns: 1fr 1fr; gap: 32px; }
    .panel { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 32px; display: flex; flex-direction: column; gap: 20px; }
    h2 { font-size: 20px; font-weight: 700; }
    .summary-row { display: flex; justify-content: space-between; font-size: 14px; color: #94a3b8; padding-bottom: 12px; border-bottom: 1px solid #334155; }
    .total-row { display: flex; justify-content: space-between; font-size: 18px; font-weight: 700; color: #f8fafc; padding-top: 8px; }
    .card-form { display: flex; flex-direction: column; gap: 14px; }
    input { background: #0f172a; border: 1px solid #334155; border-radius: 8px; padding: 10px 14px; color: #f8fafc; font-size: 14px; height: 44px; width: 100%; }
    .btn-pay { background: #10b981; color: white; border: none; border-radius: 8px; padding: 12px; font-size: 15px; font-weight: 600; cursor: pointer; height: 46px; }
  </style>
</head>
<body>
  <nav><div class="logo">SaaS Billing Portal</div><span style="font-size:13px;color:#94a3b8;">Secure Checkout</span></nav>
  <div class="content-wrap">
    <div class="panel">
      <h2>Order Summary</h2>
      <div class="summary-row"><span>Enterprise Tier (Annual)</span><span style="color:#f8fafc;">$2,400.00</span></div>
      <div class="summary-row"><span>Dedicated Compute Add-on</span><span style="color:#f8fafc;">$480.00</span></div>
      <div class="summary-row"><span>Annual Discount (20%)</span><span style="color:#10b981;">-$576.00</span></div>
      <div class="total-row"><span>Total Due Today</span><span style="color:#3b82f6;">$2,304.00</span></div>
    </div>
    <div class="panel">
      <h2>Payment Method</h2>
      <form class="card-form">
        <input type="text" placeholder="Cardholder Name" />
        <input type="text" placeholder="Card Number (•••• •••• •••• ••••)" />
        <div style="display:flex;gap:12px;"><input type="text" placeholder="MM / YY" /><input type="text" placeholder="CVC" /></div>
        <button type="button" class="btn-pay">Pay $2,304.00</button>
      </form>
    </div>
  </div>
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

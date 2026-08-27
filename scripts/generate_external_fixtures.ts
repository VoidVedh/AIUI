import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

interface FixtureDef {
  name: string;
  viewport: { width: number; height: number };
  html: string;
}

const fixtures: FixtureDef[] = [
  {
    name: "saas-pricing-table",
    viewport: { width: 1280, height: 800 },
    html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>body { font-family: 'Inter', sans-serif; }</style>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen p-10 flex flex-col justify-center items-center">
  <div class="max-w-6xl w-full">
    <div class="text-center mb-10">
      <span class="px-3 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 rounded-full text-xs font-semibold uppercase tracking-wider">Flexible Plans</span>
      <h1 class="text-4xl font-extrabold mt-3 text-white tracking-tight">Scale your engineering workflow</h1>
      <p class="text-slate-400 mt-2 text-base">Simple, transparent pricing. No credit card required to start.</p>
      <div class="flex items-center justify-center gap-3 mt-6">
        <span class="text-sm font-medium text-slate-300">Monthly</span>
        <div class="w-12 h-6 bg-indigo-600 rounded-full p-1 flex items-center justify-end cursor-pointer"><div class="w-4 h-4 bg-white rounded-full"></div></div>
        <span class="text-sm font-medium text-slate-300">Yearly <span class="text-xs text-emerald-400 font-semibold">(Save 25%)</span></span>
      </div>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between h-[480px]">
        <div>
          <h3 class="text-lg font-bold text-white">Starter</h3>
          <p class="text-xs text-slate-400 mt-1">For solo developers & hobbyists</p>
          <div class="mt-4"><span class="text-3xl font-extrabold text-white">$19</span><span class="text-slate-400 text-sm"> / month</span></div>
          <ul class="mt-6 space-y-3 text-sm text-slate-300">
            <li class="flex items-center gap-2"><span class="text-indigo-400 font-bold">✓</span> Up to 5 projects</li>
            <li class="flex items-center gap-2"><span class="text-indigo-400 font-bold">✓</span> Community support</li>
            <li class="flex items-center gap-2"><span class="text-indigo-400 font-bold">✓</span> 10k API requests/mo</li>
          </ul>
        </div>
        <button class="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-semibold border border-slate-700">Start 14-day trial</button>
      </div>
      <div class="bg-gradient-to-b from-indigo-950/80 to-slate-900 border-2 border-indigo-500 rounded-2xl p-7 flex flex-col justify-between h-[520px] shadow-2xl relative">
        <div class="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-indigo-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Most Popular</div>
        <div>
          <h3 class="text-xl font-bold text-white">Professional</h3>
          <p class="text-xs text-indigo-200 mt-1">For growing product teams</p>
          <div class="mt-4"><span class="text-4xl font-extrabold text-white">$49</span><span class="text-slate-400 text-sm"> / month</span></div>
          <ul class="mt-6 space-y-3 text-sm text-slate-200">
            <li class="flex items-center gap-2"><span class="text-indigo-400 font-bold">✓</span> Unlimited active projects</li>
            <li class="flex items-center gap-2"><span class="text-indigo-400 font-bold">✓</span> Priority email & chat support</li>
            <li class="flex items-center gap-2"><span class="text-indigo-400 font-bold">✓</span> 250k API requests/mo</li>
            <li class="flex items-center gap-2"><span class="text-indigo-400 font-bold">✓</span> Custom domain aliases</li>
            <li class="flex items-center gap-2"><span class="text-indigo-400 font-bold">✓</span> Real-time analytics</li>
          </ul>
        </div>
        <button class="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/25">Get Started with Pro</button>
      </div>
      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between h-[480px]">
        <div>
          <h3 class="text-lg font-bold text-white">Enterprise</h3>
          <p class="text-xs text-slate-400 mt-1">For mission-critical deployments</p>
          <div class="mt-4"><span class="text-3xl font-extrabold text-white">$199</span><span class="text-slate-400 text-sm"> / month</span></div>
          <ul class="mt-6 space-y-3 text-sm text-slate-300">
            <li class="flex items-center gap-2"><span class="text-indigo-400 font-bold">✓</span> Dedicated VPC hosting</li>
            <li class="flex items-center gap-2"><span class="text-indigo-400 font-bold">✓</span> 99.99% SLA guarantee</li>
            <li class="flex items-center gap-2"><span class="text-indigo-400 font-bold">✓</span> Custom SSO (SAML & Okta)</li>
            <li class="flex items-center gap-2"><span class="text-indigo-400 font-bold">✓</span> 24/7 dedicated support rep</li>
          </ul>
        </div>
        <button class="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-semibold border border-slate-700">Contact Sales</button>
      </div>
    </div>
  </div>
</body>
</html>`
  },
  {
    name: "analytics-dark-dashboard",
    viewport: { width: 1280, height: 800 },
    html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>body { font-family: 'Inter', sans-serif; }</style>
</head>
<body class="bg-neutral-950 text-neutral-100 min-h-screen flex">
  <aside class="w-64 bg-neutral-900 border-r border-neutral-800 p-6 flex flex-col justify-between">
    <div>
      <div class="flex items-center gap-3 mb-8">
        <div class="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center font-bold text-neutral-950">Q</div>
        <span class="font-bold text-lg text-white">QuantumMetrics</span>
      </div>
      <nav class="space-y-1 text-sm font-medium">
        <a class="flex items-center gap-3 px-3 py-2 bg-neutral-800 text-emerald-400 rounded-lg">📊 Overview</a>
        <a class="flex items-center gap-3 px-3 py-2 text-neutral-400 hover:text-white">📈 Performance</a>
        <a class="flex items-center gap-3 px-3 py-2 text-neutral-400 hover:text-white">👥 User Cohorts</a>
        <a class="flex items-center gap-3 px-3 py-2 text-neutral-400 hover:text-white">⚙️ Settings</a>
      </nav>
    </div>
    <div class="flex items-center gap-3 p-2 bg-neutral-850 rounded-lg">
      <div class="w-8 h-8 rounded-full bg-neutral-700"></div>
      <div class="text-xs"><div class="font-semibold text-white">Alex Morgan</div><div class="text-neutral-500">Lead Analyst</div></div>
    </div>
  </aside>
  <main class="flex-1 p-8 overflow-y-auto">
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-2xl font-bold text-white">Telemetry & Performance</h1>
        <p class="text-neutral-400 text-sm">Real-time system load and conversion stats</p>
      </div>
      <div class="flex gap-3">
        <button class="px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-sm text-neutral-300">Last 30 Days</button>
        <button class="px-4 py-2 bg-emerald-500 text-neutral-950 font-semibold rounded-lg text-sm">Export Report</button>
      </div>
    </div>
    <div class="grid grid-cols-4 gap-5 mb-8">
      <div class="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
        <div class="text-xs text-neutral-400 uppercase font-semibold">Total Revenue</div>
        <div class="text-2xl font-bold text-white mt-1">$128,430</div>
        <div class="text-xs text-emerald-400 mt-2 font-medium">↑ +14.2% vs last mo</div>
      </div>
      <div class="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
        <div class="text-xs text-neutral-400 uppercase font-semibold">Active Sessions</div>
        <div class="text-2xl font-bold text-white mt-1">42,910</div>
        <div class="text-xs text-emerald-400 mt-2 font-medium">↑ +8.4% vs last mo</div>
      </div>
      <div class="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
        <div class="text-xs text-neutral-400 uppercase font-semibold">Conversion Rate</div>
        <div class="text-2xl font-bold text-white mt-1">3.82%</div>
        <div class="text-xs text-rose-400 mt-2 font-medium">↓ -0.4% vs last mo</div>
      </div>
      <div class="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
        <div class="text-xs text-neutral-400 uppercase font-semibold">Avg Latency</div>
        <div class="text-2xl font-bold text-white mt-1">48ms</div>
        <div class="text-xs text-emerald-400 mt-2 font-medium">↑ 12ms faster</div>
      </div>
    </div>
    <div class="grid grid-cols-3 gap-6">
      <div class="col-span-2 bg-neutral-900 border border-neutral-800 rounded-xl p-6 h-72 flex flex-col justify-between">
        <div class="flex items-center justify-between"><h3 class="font-bold text-white">Monthly Traffic Distribution</h3><span class="text-xs text-neutral-400">Hourly aggregates</span></div>
        <div class="flex items-end gap-3 h-44 pt-4 border-b border-neutral-800">
          <div class="flex-1 bg-emerald-500/20 hover:bg-emerald-500 rounded-t h-[40%]"></div>
          <div class="flex-1 bg-emerald-500/20 hover:bg-emerald-500 rounded-t h-[65%]"></div>
          <div class="flex-1 bg-emerald-500/20 hover:bg-emerald-500 rounded-t h-[85%]"></div>
          <div class="flex-1 bg-emerald-500/20 hover:bg-emerald-500 rounded-t h-[55%]"></div>
          <div class="flex-1 bg-emerald-500/20 hover:bg-emerald-500 rounded-t h-[95%]"></div>
          <div class="flex-1 bg-emerald-500/20 hover:bg-emerald-500 rounded-t h-[75%]"></div>
          <div class="flex-1 bg-emerald-500/20 hover:bg-emerald-500 rounded-t h-[80%]"></div>
        </div>
        <div class="flex justify-between text-xs text-neutral-500 pt-2"><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span></div>
      </div>
      <div class="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
        <h3 class="font-bold text-white mb-4">Top Referrers</h3>
        <div class="space-y-4 text-sm">
          <div class="flex items-center justify-between"><span>github.com</span><span class="font-bold text-white">48.2%</span></div>
          <div class="w-full bg-neutral-800 h-1.5 rounded"><div class="bg-emerald-500 h-1.5 rounded w-[48%]"></div></div>
          <div class="flex items-center justify-between"><span>news.ycombinator.com</span><span class="font-bold text-white">28.4%</span></div>
          <div class="w-full bg-neutral-800 h-1.5 rounded"><div class="bg-emerald-500 h-1.5 rounded w-[28%]"></div></div>
          <div class="flex items-center justify-between"><span>twitter.com</span><span class="font-bold text-white">14.1%</span></div>
          <div class="w-full bg-neutral-800 h-1.5 rounded"><div class="bg-emerald-500 h-1.5 rounded w-[14%]"></div></div>
        </div>
      </div>
    </div>
  </main>
</body>
</html>`
  },
  {
    name: "ecommerce-product-page",
    viewport: { width: 1280, height: 800 },
    html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>body { font-family: 'Plus Jakarta Sans', sans-serif; }</style>
</head>
<body class="bg-white text-zinc-900 min-h-screen">
  <header class="border-b border-zinc-200 px-8 py-4 flex items-center justify-between">
    <div class="text-xl font-black tracking-tighter">AURA STUDIOS</div>
    <nav class="flex gap-8 text-sm font-medium text-zinc-600"><a>Apparel</a><a>Footwear</a><a>Accessories</a><a>Editorial</a></nav>
    <div class="flex items-center gap-4 text-sm font-medium"><button>Search</button><button class="px-3 py-1.5 bg-zinc-900 text-white rounded-full text-xs">Cart (2)</button></div>
  </header>
  <main class="max-w-6xl mx-auto px-8 py-12 grid grid-cols-2 gap-12 items-center">
    <div class="grid grid-cols-2 gap-4">
      <div class="bg-zinc-100 rounded-2xl h-64 flex items-center justify-center text-4xl">👟</div>
      <div class="bg-zinc-100 rounded-2xl h-64 flex items-center justify-center text-4xl">🔍</div>
      <div class="bg-zinc-100 rounded-2xl h-64 flex items-center justify-center text-4xl">📐</div>
      <div class="bg-zinc-100 rounded-2xl h-64 flex items-center justify-center text-4xl">🏷️</div>
    </div>
    <div class="flex flex-col justify-center">
      <div class="text-xs font-bold uppercase tracking-wider text-zinc-500">Limited Edition</div>
      <h1 class="text-3xl font-extrabold mt-1 tracking-tight">Veloce Carbon Runner v3</h1>
      <div class="flex items-center gap-2 mt-3">
        <span class="text-2xl font-bold">$240.00</span>
        <span class="text-xs px-2 py-0.5 bg-zinc-100 text-zinc-600 font-semibold rounded">In Stock</span>
      </div>
      <p class="text-zinc-600 text-sm mt-4 leading-relaxed">Precision-engineered with responsive dual-density cushioning and a rigid carbon-fiber torsion plate for marathon pacing.</p>
      <div class="mt-6">
        <div class="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Select Size (US Men)</div>
        <div class="grid grid-cols-5 gap-2 text-sm font-medium">
          <button class="py-2.5 border border-zinc-200 rounded-lg hover:border-zinc-900">8.0</button>
          <button class="py-2.5 border border-zinc-200 rounded-lg hover:border-zinc-900">8.5</button>
          <button class="py-2.5 bg-zinc-900 text-white rounded-lg">9.0</button>
          <button class="py-2.5 border border-zinc-200 rounded-lg hover:border-zinc-900">9.5</button>
          <button class="py-2.5 border border-zinc-200 rounded-lg hover:border-zinc-900">10.0</button>
        </div>
      </div>
      <div class="mt-8 flex gap-4">
        <button class="flex-1 py-3.5 bg-zinc-900 text-white font-bold rounded-xl text-sm hover:bg-zinc-800">Add to Bag</button>
        <button class="px-5 py-3.5 border border-zinc-300 rounded-xl font-bold text-sm">♡</button>
      </div>
      <div class="mt-8 pt-6 border-t border-zinc-100 text-xs text-zinc-500 space-y-2">
        <div>📦 Free express shipping on orders over $150</div>
        <div>🔄 30-day trial with hassle-free returns</div>
      </div>
    </div>
  </main>
</body>
</html>`
  },
  {
    name: "testimonial-carousel-section",
    viewport: { width: 1280, height: 800 },
    html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>body { font-family: 'Inter', sans-serif; }</style>
</head>
<body class="bg-stone-900 text-stone-100 min-h-screen p-12 flex flex-col justify-center items-center">
  <div class="max-w-5xl w-full">
    <div class="text-center mb-12">
      <span class="text-amber-400 font-semibold text-sm tracking-widest uppercase">Trusted by Industry Leaders</span>
      <h2 class="text-3xl font-bold mt-2 text-white">What our global partners are saying</h2>
    </div>
    <div class="grid grid-cols-3 gap-6">
      <div class="bg-stone-800/80 border border-stone-700 rounded-2xl p-6 flex flex-col justify-between">
        <div>
          <div class="text-amber-400 text-sm mb-3">★★★★★</div>
          <p class="text-stone-300 text-sm leading-relaxed">"The automated visual testing pipeline caught three critical regressions before our major v2 launch. Indispensable for our design system."</p>
        </div>
        <div class="flex items-center gap-3 mt-6 pt-4 border-t border-stone-700/60">
          <div class="w-10 h-10 rounded-full bg-stone-700 flex items-center justify-center font-bold text-amber-300">SC</div>
          <div><div class="font-semibold text-sm text-white">Sarah Chen</div><div class="text-xs text-stone-400">VP of Product, FinScale</div></div>
        </div>
      </div>
      <div class="bg-stone-800/80 border border-amber-500/40 rounded-2xl p-6 flex flex-col justify-between shadow-xl">
        <div>
          <div class="text-amber-400 text-sm mb-3">★★★★★</div>
          <p class="text-stone-200 text-sm leading-relaxed">"Reduced our frontend review cycle time from 4 days to 40 minutes. We can iterate with complete confidence across all breakpoints."</p>
        </div>
        <div class="flex items-center gap-3 mt-6 pt-4 border-t border-stone-700/60">
          <div class="w-10 h-10 rounded-full bg-stone-700 flex items-center justify-center font-bold text-amber-300">DK</div>
          <div><div class="font-semibold text-sm text-white">David Kim</div><div class="text-xs text-stone-400">Principal Architect, Nexus</div></div>
        </div>
      </div>
      <div class="bg-stone-800/80 border border-stone-700 rounded-2xl p-6 flex flex-col justify-between">
        <div>
          <div class="text-amber-400 text-sm mb-3">★★★★★</div>
          <p class="text-stone-300 text-sm leading-relaxed">"The fidelity and speed of layout reconstruction are remarkable. It feels like magic for complex responsive dashboards."</p>
        </div>
        <div class="flex items-center gap-3 mt-6 pt-4 border-t border-stone-700/60">
          <div class="w-10 h-10 rounded-full bg-stone-700 flex items-center justify-center font-bold text-amber-300">ER</div>
          <div><div class="font-semibold text-sm text-white">Elena Rostova</div><div class="text-xs text-stone-400">Head of UX, CloudPulse</div></div>
        </div>
      </div>
    </div>
    <div class="flex justify-center gap-2 mt-8">
      <div class="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
      <div class="w-2.5 h-2.5 rounded-full bg-stone-700"></div>
      <div class="w-2.5 h-2.5 rounded-full bg-stone-700"></div>
    </div>
  </div>
</body>
</html>`
  },
  {
    name: "fintech-transfer-modal",
    viewport: { width: 1280, height: 800 },
    html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>body { font-family: 'Inter', sans-serif; }</style>
</head>
<body class="bg-slate-900 text-slate-100 min-h-screen flex items-center justify-center p-6">
  <div class="bg-slate-950 border border-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl">
    <div class="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
      <h2 class="text-lg font-bold text-white">Send Money Instantly</h2>
      <button class="text-slate-500 hover:text-white text-lg">✕</button>
    </div>
    <div class="space-y-4">
      <div>
        <label class="text-xs font-semibold text-slate-400 uppercase">You Send</label>
        <div class="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl p-3 mt-1">
          <input type="text" value="2,500.00" class="bg-transparent text-xl font-bold text-white outline-none w-1/2">
          <span class="px-3 py-1 bg-slate-800 rounded-lg text-sm font-semibold text-white">🇺🇸 USD</span>
        </div>
      </div>
      <div class="flex justify-center -my-2 relative z-10">
        <div class="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shadow">↓</div>
      </div>
      <div>
        <label class="text-xs font-semibold text-slate-400 uppercase">Recipient Receives</label>
        <div class="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl p-3 mt-1">
          <input type="text" value="2,310.45" class="bg-transparent text-xl font-bold text-emerald-400 outline-none w-1/2" readonly>
          <span class="px-3 py-1 bg-slate-800 rounded-lg text-sm font-semibold text-white">🇪🇺 EUR</span>
        </div>
      </div>
      <div class="bg-slate-900/60 rounded-xl p-3 text-xs text-slate-400 space-y-1">
        <div class="flex justify-between"><span>Exchange Rate</span><span class="text-slate-200">1 USD = 0.9241 EUR</span></div>
        <div class="flex justify-between"><span>Transfer Fee</span><span class="text-emerald-400 font-semibold">Free ($0.00)</span></div>
        <div class="flex justify-between"><span>Estimated Arrival</span><span class="text-slate-200">Instant (&lt; 10s)</span></div>
      </div>
    </div>
    <button class="w-full mt-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-sm shadow-lg shadow-blue-600/30">Confirm Transfer</button>
  </div>
</body>
</html>`
  },
  {
    name: "marketing-hero-asymmetric",
    viewport: { width: 1280, height: 800 },
    html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>body { font-family: 'Plus Jakarta Sans', sans-serif; }</style>
</head>
<body class="bg-zinc-950 text-zinc-100 min-h-screen flex flex-col justify-between">
  <header class="px-10 py-6 flex items-center justify-between border-b border-zinc-900">
    <div class="text-xl font-black text-violet-400">SYNAPSE.AI</div>
    <nav class="flex gap-6 text-sm text-zinc-400"><a>Models</a><a>Capabilities</a><a>Benchmarks</a><a>Docs</a></nav>
    <button class="px-4 py-2 bg-violet-600 text-white rounded-lg text-xs font-bold">Launch Console</button>
  </header>
  <main class="max-w-6xl mx-auto px-10 py-16 grid grid-cols-12 gap-10 items-center">
    <div class="col-span-7">
      <div class="inline-flex items-center gap-2 px-3 py-1 bg-violet-950 border border-violet-800 text-violet-300 text-xs font-semibold rounded-full mb-4">🚀 Synapse 4.0 Released</div>
      <h1 class="text-5xl font-extrabold text-white leading-tight tracking-tight">Autonomous multi-agent intelligence for enterprise code</h1>
      <p class="text-zinc-400 text-base mt-4 max-w-lg leading-relaxed">Deconstruct complex UI designs, orchestrate parallel refactoring pipelines, and verify outputs with automated pixel-exact feedback loops.</p>
      <div class="flex gap-4 mt-8">
        <input type="email" placeholder="Enter work email" class="px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white w-72 outline-none">
        <button class="px-6 py-3 bg-violet-600 hover:bg-violet-500 font-bold rounded-xl text-sm text-white shadow-lg shadow-violet-600/30">Request Access</button>
      </div>
    </div>
    <div class="col-span-5 bg-gradient-to-br from-violet-900/40 to-zinc-900 border border-violet-700/50 rounded-3xl p-6 shadow-2xl">
      <div class="flex items-center justify-between pb-3 border-b border-zinc-800 text-xs text-zinc-400 font-mono"><span>pipeline.ts</span><span>99.4% MSSIM</span></div>
      <div class="mt-4 font-mono text-xs text-violet-300 space-y-2">
        <div><span class="text-zinc-500">1</span> const result = await orchestrator.run({</div>
        <div><span class="text-zinc-500">2</span>   mode: "autonomous_dual_pass",</div>
        <div><span class="text-zinc-500">3</span>   fidelityThreshold: 0.95,</div>
        <div><span class="text-zinc-500">4</span>   autoCorrect: true</div>
        <div><span class="text-zinc-500">5</span> });</div>
      </div>
      <div class="mt-6 p-3 bg-zinc-950/80 rounded-xl border border-zinc-800 text-xs flex items-center justify-between">
        <span class="text-emerald-400 font-bold">✓ Verification Complete</span>
        <span class="text-zinc-400">0 regressions</span>
      </div>
    </div>
  </main>
  <footer class="px-10 py-4 border-t border-zinc-900 text-xs text-zinc-500 flex justify-between">
    <span>© 2026 Synapse Labs</span>
    <span>SOC-2 Type II Certified</span>
  </footer>
</body>
</html>`
  },
  {
    name: "settings-multi-column-form",
    viewport: { width: 1280, height: 800 },
    html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>body { font-family: 'Inter', sans-serif; }</style>
</head>
<body class="bg-gray-50 text-gray-900 min-h-screen p-8 flex justify-center">
  <div class="max-w-4xl w-full bg-white border border-gray-200 rounded-2xl shadow-sm p-8">
    <div class="pb-6 border-b border-gray-200 mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Organization Settings</h1>
      <p class="text-sm text-gray-500 mt-1">Manage workspace preferences, team access, and notification webhooks.</p>
    </div>
    <div class="space-y-6">
      <div class="grid grid-cols-3 gap-6 items-center">
        <div><h3 class="text-sm font-semibold text-gray-900">Workspace Name</h3><p class="text-xs text-gray-500">Displayed on invoices and public invites.</p></div>
        <div class="col-span-2"><input type="text" value="Acme Design Systems" class="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-blue-500"></div>
      </div>
      <div class="grid grid-cols-3 gap-6 items-center">
        <div><h3 class="text-sm font-semibold text-gray-900">Primary Contact Email</h3><p class="text-xs text-gray-500">Billing alerts and security notifications.</p></div>
        <div class="col-span-2"><input type="email" value="admin@acmedesign.io" class="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-blue-500"></div>
      </div>
      <div class="grid grid-cols-3 gap-6 items-center">
        <div><h3 class="text-sm font-semibold text-gray-900">Two-Factor Authentication</h3><p class="text-xs text-gray-500">Require all members to authenticate with WebAuthn.</p></div>
        <div class="col-span-2 flex items-center gap-3">
          <div class="w-10 h-5 bg-blue-600 rounded-full p-0.5 flex justify-end cursor-pointer"><div class="w-4 h-4 bg-white rounded-full"></div></div>
          <span class="text-xs font-semibold text-gray-700">Enforced for 24 team members</span>
        </div>
      </div>
      <div class="grid grid-cols-3 gap-6 items-center">
        <div><h3 class="text-sm font-semibold text-gray-900">Default Member Role</h3><p class="text-xs text-gray-500">Assigned when new users join via domain SSO.</p></div>
        <div class="col-span-2">
          <select class="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm bg-white outline-none">
            <option>Editor (Can create and modify projects)</option>
            <option>Viewer (Read-only access)</option>
            <option>Admin (Full administrative privileges)</option>
          </select>
        </div>
      </div>
    </div>
    <div class="mt-8 pt-6 border-t border-gray-200 flex justify-end gap-3">
      <button class="px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50">Cancel</button>
      <button class="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold shadow-sm">Save Changes</button>
    </div>
  </div>
</body>
</html>`
  },
  {
    name: "crypto-portfolio-tracker",
    viewport: { width: 1280, height: 800 },
    html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>body { font-family: 'Inter', sans-serif; }</style>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen p-8">
  <div class="max-w-6xl mx-auto">
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-3xl font-extrabold text-white">Assets & Portfolio</h1>
        <p class="text-slate-400 text-sm">Real-time valuation across 4 connected wallets</p>
      </div>
      <div class="flex gap-3">
        <button class="px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm font-semibold text-slate-300">+ Add Wallet</button>
        <button class="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-600/25">Trade / Swap</button>
      </div>
    </div>
    <div class="grid grid-cols-3 gap-6 mb-8">
      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div class="text-xs text-slate-400 font-semibold uppercase">Total Net Worth</div>
        <div class="text-3xl font-extrabold text-white mt-2">$342,890.12</div>
        <div class="text-xs text-emerald-400 font-semibold mt-2">↑ +$12,450.00 (3.7%) today</div>
      </div>
      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div class="text-xs text-slate-400 font-semibold uppercase">24h Staking Yield</div>
        <div class="text-3xl font-extrabold text-white mt-2">$84.50</div>
        <div class="text-xs text-slate-400 mt-2">Annual APY avg: 6.8%</div>
      </div>
      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div class="text-xs text-slate-400 font-semibold uppercase">Risk Allocation</div>
        <div class="text-3xl font-extrabold text-emerald-400 mt-2">Balanced</div>
        <div class="text-xs text-slate-400 mt-2">78% Bluechip / 22% DeFi</div>
      </div>
    </div>
    <div class="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
      <table class="w-full text-left text-sm">
        <thead class="bg-slate-850 text-xs text-slate-400 uppercase border-b border-slate-800">
          <tr><th class="p-4">Asset</th><th class="p-4">Holdings</th><th class="p-4">Price</th><th class="p-4">24h Change</th><th class="p-4 text-right">Value</th></tr>
        </thead>
        <tbody class="divide-y divide-slate-800 text-slate-200">
          <tr><td class="p-4 font-bold text-white flex items-center gap-2"><span class="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-bold">₿</span> Bitcoin</td><td class="p-4">3.45 BTC</td><td class="p-4">$64,200.00</td><td class="p-4 text-emerald-400 font-semibold">+2.8%</td><td class="p-4 text-right font-bold text-white">$221,490.00</td></tr>
          <tr><td class="p-4 font-bold text-white flex items-center gap-2"><span class="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold">Ξ</span> Ethereum</td><td class="p-4">28.50 ETH</td><td class="p-4">$3,450.00</td><td class="p-4 text-emerald-400 font-semibold">+4.1%</td><td class="p-4 text-right font-bold text-white">$98,325.00</td></tr>
          <tr><td class="p-4 font-bold text-white flex items-center gap-2"><span class="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs font-bold">◎</span> Solana</td><td class="p-4">154.00 SOL</td><td class="p-4">$150.00</td><td class="p-4 text-rose-400 font-semibold">-1.2%</td><td class="p-4 text-right font-bold text-white">$23,100.00</td></tr>
        </tbody>
      </table>
    </div>
  </div>
</body>
</html>`
  },
  {
    name: "course-learning-platform",
    viewport: { width: 1280, height: 800 },
    html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>body { font-family: 'Inter', sans-serif; }</style>
</head>
<body class="bg-gray-900 text-gray-100 min-h-screen flex flex-col">
  <header class="h-16 bg-gray-950 border-b border-gray-800 px-6 flex items-center justify-between">
    <div class="flex items-center gap-3"><span class="text-cyan-400 font-bold text-lg">CodeCraft Academy</span><span class="text-xs px-2 py-0.5 bg-gray-800 text-gray-300 rounded">React 19 Masterclass</span></div>
    <div class="flex items-center gap-4 text-xs font-semibold"><span>Progress: 68%</span><div class="w-32 bg-gray-800 h-2 rounded-full overflow-hidden"><div class="bg-cyan-400 h-full w-[68%]"></div></div></div>
  </header>
  <div class="flex-1 flex overflow-hidden">
    <main class="flex-1 p-8 overflow-y-auto">
      <div class="bg-black rounded-2xl h-96 flex items-center justify-center text-6xl border border-gray-800 relative">
        <span>▶️</span>
        <div class="absolute bottom-4 left-4 right-4 bg-gray-900/80 backdrop-blur rounded-xl p-3 flex items-center justify-between text-xs">
          <span>04:18 / 18:40</span>
          <span>Lesson 12: Server Actions & Optimistic Hooks</span>
          <span>1080p 60fps</span>
        </div>
      </div>
      <div class="mt-6">
        <h1 class="text-2xl font-bold text-white">Advanced State Transitions in React 19</h1>
        <p class="text-gray-400 text-sm mt-2 leading-relaxed">Learn how to leverage useOptimistic and useActionState to eliminate visual latency in interactive forms.</p>
      </div>
    </main>
    <aside class="w-80 bg-gray-950 border-l border-gray-800 p-6 overflow-y-auto">
      <h3 class="font-bold text-sm text-gray-200 mb-4">Course Modules</h3>
      <div class="space-y-2 text-xs">
        <div class="p-3 bg-gray-900 border border-gray-800 rounded-xl flex items-center justify-between"><span class="text-emerald-400">✓ 1. Introduction</span><span class="text-gray-500">12m</span></div>
        <div class="p-3 bg-gray-900 border border-gray-800 rounded-xl flex items-center justify-between"><span class="text-emerald-400">✓ 2. React Server Components</span><span class="text-gray-500">25m</span></div>
        <div class="p-3 bg-cyan-950/60 border border-cyan-500/40 rounded-xl flex items-center justify-between font-bold text-cyan-300"><span>▶ 3. Optimistic Transitions</span><span class="text-cyan-400">18m</span></div>
        <div class="p-3 bg-gray-900 border border-gray-800 rounded-xl flex items-center justify-between text-gray-400"><span>🔒 4. Compiler Directives</span><span class="text-gray-500">30m</span></div>
      </div>
    </aside>
  </div>
</body>
</html>`
  },
  {
    name: "mobile-banking-app",
    viewport: { width: 390, height: 844 },
    html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>body { font-family: 'Plus Jakarta Sans', sans-serif; }</style>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen p-6 flex flex-col justify-between">
  <div>
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white">M</div>
        <div><div class="text-xs text-slate-400">Welcome back,</div><div class="font-bold text-white text-sm">Marcus Vance</div></div>
      </div>
      <div class="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-sm">🔔</div>
    </div>
    <div class="bg-gradient-to-tr from-indigo-900 to-indigo-600 rounded-3xl p-6 shadow-xl mb-6 text-white">
      <div class="text-xs text-indigo-200">Checking Account (••4892)</div>
      <div class="text-3xl font-extrabold mt-2">$18,450.80</div>
      <div class="mt-6 flex justify-between text-xs text-indigo-100"><span>Exp 09/28</span><span>VISA Platinum</span></div>
    </div>
    <div class="grid grid-cols-4 gap-3 mb-6 text-center text-xs">
      <div class="bg-slate-900 p-3 rounded-2xl border border-slate-800"><div class="text-base mb-1">↗️</div>Send</div>
      <div class="bg-slate-900 p-3 rounded-2xl border border-slate-800"><div class="text-base mb-1">↙️</div>Request</div>
      <div class="bg-slate-900 p-3 rounded-2xl border border-slate-800"><div class="text-base mb-1">📄</div>Bills</div>
      <div class="bg-slate-900 p-3 rounded-2xl border border-slate-800"><div class="text-base mb-1">⚙️</div>More</div>
    </div>
    <div>
      <div class="flex justify-between items-center mb-3"><h3 class="font-bold text-sm text-white">Recent Activity</h3><span class="text-xs text-indigo-400 font-semibold">See all</span></div>
      <div class="space-y-3 text-xs">
        <div class="bg-slate-900 border border-slate-800 p-3 rounded-xl flex items-center justify-between"><div><div class="font-semibold text-white">Apple Store</div><div class="text-slate-400">Electronics</div></div><div class="font-bold text-white">-$1,299.00</div></div>
        <div class="bg-slate-900 border border-slate-800 p-3 rounded-xl flex items-center justify-between"><div><div class="font-semibold text-white">Salary Deposit</div><div class="text-slate-400">Employer Inc</div></div><div class="font-bold text-emerald-400">+$4,500.00</div></div>
      </div>
    </div>
  </div>
  <nav class="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex justify-around text-xs text-slate-400">
    <div class="text-indigo-400 font-bold">🏠 Home</div>
    <div>📊 Stats</div>
    <div>💳 Cards</div>
    <div>👤 Profile</div>
  </nav>
</body>
</html>`
  },
  {
    name: "job-board-listing",
    viewport: { width: 1280, height: 800 },
    html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>body { font-family: 'Inter', sans-serif; }</style>
</head>
<body class="bg-zinc-900 text-zinc-100 min-h-screen p-8">
  <div class="max-w-5xl mx-auto">
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-3xl font-extrabold text-white">Tech Career Board</h1>
        <p class="text-zinc-400 text-sm">1,420 open roles at top engineering startups</p>
      </div>
      <button class="px-4 py-2 bg-emerald-500 text-zinc-950 font-bold rounded-xl text-sm">+ Post a Job</button>
    </div>
    <div class="space-y-4">
      <div class="bg-zinc-950 border border-zinc-800 hover:border-zinc-700 rounded-2xl p-6 flex items-center justify-between transition">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-xl bg-violet-600 flex items-center justify-center font-bold text-white text-lg">S</div>
          <div>
            <h3 class="text-lg font-bold text-white">Staff AI Systems Engineer</h3>
            <div class="text-xs text-zinc-400 flex gap-3 mt-1"><span>Starlight AI</span><span>•</span><span>San Francisco / Remote</span><span>•</span><span class="text-emerald-400 font-semibold">$220k - $280k</span></div>
          </div>
        </div>
        <button class="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-semibold">Apply Now</button>
      </div>
      <div class="bg-zinc-950 border border-zinc-800 hover:border-zinc-700 rounded-2xl p-6 flex items-center justify-between transition">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white text-lg">N</div>
          <div>
            <h3 class="text-lg font-bold text-white">Lead React Native Architect</h3>
            <div class="text-xs text-zinc-400 flex gap-3 mt-1"><span>Nova Health</span><span>•</span><span>New York / Remote</span><span>•</span><span class="text-emerald-400 font-semibold">$190k - $240k</span></div>
          </div>
        </div>
        <button class="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-semibold">Apply Now</button>
      </div>
      <div class="bg-zinc-950 border border-zinc-800 hover:border-zinc-700 rounded-2xl p-6 flex items-center justify-between transition">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-xl bg-amber-600 flex items-center justify-center font-bold text-white text-lg">P</div>
          <div>
            <h3 class="text-lg font-bold text-white">Senior Distributed Systems Dev</h3>
            <div class="text-xs text-zinc-400 flex gap-3 mt-1"><span>Prism Data</span><span>•</span><span>London / Hybrid</span><span>•</span><span class="text-emerald-400 font-semibold">£130k - £160k</span></div>
          </div>
        </div>
        <button class="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-semibold">Apply Now</button>
      </div>
    </div>
  </div>
</body>
</html>`
  },
  {
    name: "travel-booking-header",
    viewport: { width: 1280, height: 800 },
    html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>body { font-family: 'Plus Jakarta Sans', sans-serif; }</style>
</head>
<body class="bg-slate-900 text-slate-100 min-h-screen flex flex-col justify-center items-center p-8">
  <div class="max-w-5xl w-full">
    <div class="text-center mb-8">
      <h1 class="text-4xl font-extrabold text-white">Find exceptional stays worldwide</h1>
      <p class="text-slate-400 text-base mt-2">Curated boutique villas, chalets, and private island retreats.</p>
    </div>
    <div class="bg-slate-950 border border-slate-800 rounded-2xl p-4 shadow-2xl grid grid-cols-4 gap-4 items-center">
      <div class="p-3 bg-slate-900 rounded-xl border border-slate-800">
        <div class="text-xs font-bold text-slate-400 uppercase">Destination</div>
        <div class="text-sm font-semibold text-white mt-1">Kyoto, Japan ⛩️</div>
      </div>
      <div class="p-3 bg-slate-900 rounded-xl border border-slate-800">
        <div class="text-xs font-bold text-slate-400 uppercase">Dates</div>
        <div class="text-sm font-semibold text-white mt-1">Oct 14 — Oct 22</div>
      </div>
      <div class="p-3 bg-slate-900 rounded-xl border border-slate-800">
        <div class="text-xs font-bold text-slate-400 uppercase">Guests</div>
        <div class="text-sm font-semibold text-white mt-1">2 Adults, 1 Child</div>
      </div>
      <button class="h-full bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30">
        <span>🔍</span> Search Luxury Stays
      </button>
    </div>
  </div>
</body>
</html>`
  },
  {
    name: "developer-api-docs",
    viewport: { width: 1280, height: 800 },
    html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>body { font-family: 'Inter', sans-serif; } code { font-family: 'JetBrains Mono', monospace; }</style>
</head>
<body class="bg-zinc-950 text-zinc-100 min-h-screen flex">
  <aside class="w-60 bg-zinc-900 border-r border-zinc-800 p-6 space-y-4 text-xs">
    <div class="font-bold text-sm text-white">Veloce API v2</div>
    <div class="text-zinc-500 uppercase font-semibold">Guides</div>
    <div class="space-y-1 text-zinc-400"><div class="text-emerald-400 font-semibold">Quickstart</div><div>Authentication</div><div>Errors & Rate Limits</div></div>
    <div class="text-zinc-500 uppercase font-semibold pt-4">Endpoints</div>
    <div class="space-y-1 text-zinc-400"><div>POST /v2/deploy</div><div>GET /v2/instances</div><div>DELETE /v2/teardown</div></div>
  </aside>
  <main class="flex-1 p-8 grid grid-cols-2 gap-8">
    <div>
      <span class="text-xs font-bold text-emerald-400 uppercase">REST Reference</span>
      <h1 class="text-2xl font-bold text-white mt-1">Deploy an Autonomous Container</h1>
      <p class="text-zinc-400 text-sm mt-3 leading-relaxed">Spawns a sandboxed ephemeral runner with verified isolated storage and GPU acceleration.</p>
      <div class="mt-6 space-y-3 text-xs">
        <div class="font-bold text-zinc-300">Request Headers</div>
        <div class="p-3 bg-zinc-900 rounded-lg border border-zinc-800 font-mono text-zinc-300">Authorization: Bearer &lt;TOKEN&gt;</div>
      </div>
    </div>
    <div class="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 font-mono text-xs text-zinc-300 h-96 flex flex-col justify-between">
      <div>
        <div class="flex justify-between text-zinc-500 pb-2 border-b border-zinc-800"><span>cURL Example</span><span>200 OK</span></div>
        <div class="mt-4 text-emerald-400">curl -X POST https://api.veloce.io/v2/deploy \\</div>
        <div class="text-zinc-400 pl-4">-H "Authorization: Bearer sec_live_99" \\</div>
        <div class="text-zinc-400 pl-4">-d '{"runtime": "node22", "memory": 4096}'</div>
      </div>
      <div class="p-3 bg-zinc-950 rounded-lg text-zinc-400">{ "status": "provisioned", "ip": "10.0.4.12" }</div>
    </div>
  </main>
</body>
</html>`
  },
  {
    name: "social-feed-card",
    viewport: { width: 1280, height: 800 },
    html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>body { font-family: 'Inter', sans-serif; }</style>
</head>
<body class="bg-slate-900 text-slate-100 min-h-screen flex items-center justify-center p-8">
  <div class="bg-slate-950 border border-slate-800 rounded-2xl p-6 max-w-xl w-full shadow-2xl">
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500"></div>
        <div><div class="font-bold text-white text-sm">Devon Archer <span class="text-xs text-blue-400">✓</span></div><div class="text-xs text-slate-400">@darcher • 3h ago</div></div>
      </div>
      <button class="text-slate-400">•••</button>
    </div>
    <p class="text-sm text-slate-200 leading-relaxed mb-4">Just shipped the zero-overfitting benchmark engine for AIUI. 16 real-world held-out UI suites with continuous anti-hardcoding CI enforcement. 🚀</p>
    <div class="bg-slate-900 border border-slate-800 rounded-xl h-48 flex items-center justify-center text-slate-500 text-sm font-mono mb-4">
      📊 Benchmark Matrix Visualization
    </div>
    <div class="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-800">
      <span>💬 42 Comments</span>
      <span>🔁 128 Reposts</span>
      <span class="text-rose-400 font-semibold">❤️ 1.4k Likes</span>
      <span>🔖 Save</span>
    </div>
  </div>
</body>
</html>`
  },
  {
    name: "crm-pipeline-kanban",
    viewport: { width: 1280, height: 800 },
    html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>body { font-family: 'Inter', sans-serif; }</style>
</head>
<body class="bg-zinc-950 text-zinc-100 min-h-screen p-8">
  <div class="flex items-center justify-between mb-6">
    <h1 class="text-2xl font-bold text-white">Deal Pipeline — Q3 Enterprise</h1>
    <button class="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold">+ New Opportunity</button>
  </div>
  <div class="grid grid-cols-3 gap-6">
    <div class="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
      <div class="flex justify-between items-center text-xs font-bold text-zinc-400 mb-4 uppercase"><span>Lead In</span><span>(2)</span></div>
      <div class="space-y-3">
        <div class="bg-zinc-950 p-4 rounded-xl border border-zinc-800"><div class="font-bold text-sm text-white">Stripe Integration</div><div class="text-xs text-emerald-400 mt-1 font-semibold">$45,000</div></div>
        <div class="bg-zinc-950 p-4 rounded-xl border border-zinc-800"><div class="font-bold text-sm text-white">Vercel Partnership</div><div class="text-xs text-emerald-400 mt-1 font-semibold">$80,000</div></div>
      </div>
    </div>
    <div class="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
      <div class="flex justify-between items-center text-xs font-bold text-zinc-400 mb-4 uppercase"><span>Negotiation</span><span>(1)</span></div>
      <div class="bg-zinc-950 p-4 rounded-xl border border-zinc-800"><div class="font-bold text-sm text-white">Shopify Global Migration</div><div class="text-xs text-emerald-400 mt-1 font-semibold">$140,000</div></div>
    </div>
    <div class="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
      <div class="flex justify-between items-center text-xs font-bold text-zinc-400 mb-4 uppercase"><span>Won / Closed</span><span>(1)</span></div>
      <div class="bg-zinc-950 p-4 rounded-xl border border-emerald-500/40"><div class="font-bold text-sm text-white">Datadog Monitoring</div><div class="text-xs text-emerald-400 mt-1 font-semibold">$220,000</div></div>
    </div>
  </div>
</body>
</html>`
  },
  {
    name: "music-player-interface",
    viewport: { width: 1280, height: 800 },
    html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>body { font-family: 'Plus Jakarta Sans', sans-serif; }</style>
</head>
<body class="bg-neutral-950 text-neutral-100 min-h-screen p-8 flex items-center justify-center">
  <div class="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-2xl">
    <div class="bg-gradient-to-br from-violet-600 to-indigo-900 rounded-2xl h-64 flex items-center justify-center text-6xl shadow-lg mb-6">
      🎧
    </div>
    <div class="flex justify-between items-center mb-4">
      <div><h2 class="text-xl font-bold text-white">Midnight Resonance</h2><p class="text-xs text-neutral-400">Solaris Wave • Cyberpunk OST</p></div>
      <button class="text-rose-400 text-lg">♥</button>
    </div>
    <div class="space-y-2 mb-6">
      <div class="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden"><div class="bg-violet-500 h-full w-[45%]"></div></div>
      <div class="flex justify-between text-xs text-neutral-500"><span>02:14</span><span>04:58</span></div>
    </div>
    <div class="flex items-center justify-around text-lg">
      <button class="text-neutral-400">🔀</button>
      <button class="text-white text-xl">⏮</button>
      <button class="w-14 h-14 rounded-full bg-white text-neutral-950 flex items-center justify-center font-bold text-2xl shadow-xl">▶</button>
      <button class="text-white text-xl">⏭</button>
      <button class="text-neutral-400">🔁</button>
    </div>
  </div>
</body>
</html>`
  },
];

async function generateAll() {
  const browser = await chromium.launch();
  const baseDir = path.resolve(process.cwd(), "fixtures-external");

  for (const fix of fixtures) {
    const dir = path.join(baseDir, fix.name);
    fs.mkdirSync(dir, { recursive: true });
    const targetPath = path.join(dir, "target.png");

    const page = await browser.newPage({
      viewport: fix.viewport,
      deviceScaleFactor: 1,
    });

    await page.setContent(fix.html, { waitUntil: "networkidle" });
    await page.screenshot({ path: targetPath, type: "png" });
    await page.close();

    console.log(`✓ Generated ${fix.name} target.png (${fix.viewport.width}x${fix.viewport.height})`);
  }

  await browser.close();
  console.log(`\nSuccessfully populated all ${fixtures.length} external fixtures in fixtures-external/`);
}

generateAll().catch((err) => {
  console.error("Fixture generation failed:", err);
  process.exit(1);
});

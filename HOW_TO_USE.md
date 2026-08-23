# How to Use AIUI — Beginner's Guide

Welcome to **AIUI**! This guide is written for anyone to use, even if you have never written a line of code or used a terminal before.

AIUI is an autonomous robot engineer: you give it a picture of a website or app design, and it automatically writes real, working code that looks identical to your picture.

---

## ⚡ Step 1: One-Time Setup (Takes 2 Minutes)

Before running AIUI for the very first time, make sure you have **Node.js** installed on your computer.

1. Go to **[https://nodejs.org/](https://nodejs.org/)**.
2. Click the big green button that says **LTS (Recommended For Most Users)**.
3. Open the downloaded installer file and follow the on-screen instructions (keep clicking "Next").

*If you already have Node.js installed, you are ready to go!*

---

## 🚀 Step 2: Start AIUI with One Click

1. Open your computer's **Terminal** (on Mac: press `Cmd + Space`, type `Terminal`, and press Enter; on Windows: open `PowerShell` or `Command Prompt`).
2. Type the following command and press Enter:

```bash
./start.sh
```

*(Alternatively, you can type: `npm run start:all`)*

**What happens next:**
- AIUI will automatically prepare everything for you.
- Your default web browser will automatically open to **`http://localhost:5173`**.
- You will see the AIUI Studio application ready to use!

---

## 🎨 Step 3: How to Convert a Design to Real Code

Follow these 4 simple steps in your browser:

### 1. Upload Your Design Image
- Click on the upload box or drag and drop any screenshot (PNG, JPG, or WebP) of a website, mobile app screen, or interface design.
- You can also click any of the **Sample Designs** at the bottom (like the *SaaS Landing Page*, *Analytics Dashboard*, or *Dense Pricing Matrix*) to try it immediately!

### 2. Choose Your Coding Language
Select the target language you want generated:
- **React 19** *(Recommended)* — Modern web component code.
- **Vanilla JavaScript** — Pure HTML5, CSS3, and JavaScript with zero extra libraries.
- **Flutter** — Mobile application code for iOS and Android.

### 3. Click "Start Autonomous Pipeline"
Sit back and watch the AI engineer work in real time!
- **Stage 1 — Analyzing UI**: Scans the screenshot and detects buttons, headings, cards, and layouts.
- **Stage 2 — Extracting Design Tokens**: Reads the exact color palette, font sizes, margins, and borders.
- **Stage 3 — Planning Components**: Breaks the screen into clean, modular building blocks.
- **Stage 4 — Generating Code**: Writes real, error-free production code.
- **Stage 5 — Browser Rendering & Self-Correction**: Renders the code in a private sandbox, compares it with your original screenshot using computer vision, and automatically fine-tunes any visual differences until the similarity reaches 92%+!

### 4. Inspect & Download Your Code
- Once finished, you can browse all generated source files in the built-in **Code Inspector**.
- Click the **Download Code (.zip)** button to save the complete project to your computer.

---

## 📂 Step 4: Running Your Downloaded Project

When you download your generated project:
1. Unzip the folder.
2. Open your Terminal inside that folder and run:
   ```bash
   npm install
   npm run dev
   ```
3. Open the URL shown in your terminal (usually `http://localhost:3000` or `http://localhost:5173`) to see your live, interactive app!

---

## 🛠️ Helpful Troubleshooting

Here are answers to the most common questions:

### "It says Port 3001 or 5173 is already in use"
Another program is using that port. You can close other running development tools, or restart your terminal and run `./start.sh` again.

### "Playwright browser is missing"
If you see a message saying Chromium is needed for headless rendering, run this quick command in your terminal:
```bash
npx playwright install chromium
```

### "How do I stop AIUI when I'm done?"
In the Terminal window where AIUI is running, press **`Ctrl + C`** on your keyboard. That cleanly shuts down the server.

---

## 💡 Need to Configure Cloud AI Keys? (Optional)
AIUI runs 100% locally by default with an offline computer-vision engine that requires no keys and incurs no costs.

If you would like to connect a cloud AI model (like Google Gemini or OpenAI):
1. Copy `.env.example` to a new file named `.env`.
2. Add your API key (e.g. `GEMINI_API_KEY=your_key_here` or `OPENAI_API_KEY=your_key_here`).
3. Restart `./start.sh`.

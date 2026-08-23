#!/usr/bin/env bash

# ==============================================================================
# AIUI — 1-Click Launch Script
# No coding required. This script starts everything and opens your browser.
# ==============================================================================

set -e

echo ""
echo "=================================================="
echo "   🤖 AIUI — Autonomous UI-to-Code Engineering Agent"
echo "=================================================="
echo ""

# 1. Check for Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js was not found on your system."
    echo "   Please download and install Node.js (LTS version recommended):"
    echo "   👉 https://nodejs.org/"
    echo ""
    echo "   Once installed, run this script again!"
    exit 1
fi

NODE_VERSION=$(node -v)
echo "✅ Node.js detected: $NODE_VERSION"

# 2. Check for npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm was not found. Please ensure Node.js is properly installed."
    exit 1
fi

# 3. Check / Install dependencies
if [ ! -d "node_modules" ]; then
    echo ""
    echo "📦 First-time launch: Installing required dependencies (this takes ~15 seconds)..."
    npm install
fi

# 4. Build Monorepo Packages
echo ""
echo "🔨 Compiling AIUI core engine and packages..."
npm run build

echo ""
echo "🚀 Starting AIUI API Server and Web Dashboard..."
echo "   Opening http://localhost:5173 in your default browser..."
echo ""

# 5. Start All Services & Open Browser
npx tsx scripts/start_all.ts

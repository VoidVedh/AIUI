import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    testTimeout: 30000,
    hookTimeout: 15000,
    fileParallelism: false, // Sequential test files prevent Playwright Vite port collisions and browser context contention
    globals: true,
    exclude: ["tests/e2e/**", "**/node_modules/**", "**/dist/**"],
  },
});


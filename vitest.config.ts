import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    testTimeout: 120000,
    hookTimeout: 30000,
    fileParallelism: false, // Sequential test files prevent Playwright Vite port collisions and browser context contention
    globals: true,
  },
});

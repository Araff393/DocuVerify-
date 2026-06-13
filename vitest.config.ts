import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    // Single-thread untuk SQLite (avoid race condition)
    pool: "forks",
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    globals: false,
    environment: "node",
    // File setup global — reset DB sebelum semua test
    globalSetup: ["./tests/global-setup.ts"],
    // Setup per-test-file — clean tables
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.ts"],
    // Exclude folder lain
    exclude: ["node_modules/**", "_legacy/**", ".next/**", "test/**"],
    testTimeout: 20_000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
});

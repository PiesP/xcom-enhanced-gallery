// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { defineConfig } from "vitest/config";
import solid from "vite-plugin-solid";
import { resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const testDir = resolve(__dirname, ".");
const srcDir = resolve(__dirname, "src");

export default defineConfig({
  define: { __DEV__: true },
  plugins: [solid()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./test/setup.ts"],
    include: ["test/unit/**/*.test.{ts,tsx}"],
    exclude: ["node_modules", "dist"],
    passWithNoTests: false,
    slowTestThreshold: 500,
    testTimeout: 10000,
    coverage: {
      provider: "v8",
      thresholds: {
        statements: 62,
        branches: 52,
        functions: 60,
        lines: 65,
      },
    },
  },
  resolve: {
    alias: {
      "@bootstrap": resolve(srcDir, "bootstrap"),
      "@constants": resolve(srcDir, "constants"),
      "@extension": resolve(srcDir, "extension"),
      "@extension/*": resolve(srcDir, "extension/*"),
      "@features": resolve(srcDir, "features"),
      "@platform": resolve(srcDir, "platform"),
      "@shared": resolve(srcDir, "shared"),
    },
  },
});

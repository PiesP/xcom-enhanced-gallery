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
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.d.ts",
        // Bootstrap entry points are exercised by Playwright rather than unit tests.
        "src/main.ts",
        "src/extension/content.ts",
        // Type-only modules have no runtime behavior to cover.
        "src/extension/extension-message-types.ts",
        "src/features/gallery/components/vertical-gallery-view/VerticalImageItem.types.ts",
        "src/platform/types.ts",
        "src/shared/components/**/*.types.ts",
        "src/shared/hooks/**/*.types.ts",
        "src/shared/i18n/types.ts",
        "src/shared/services/media/types.ts",
        "src/shared/types/core/cookie.types.ts",
        "src/shared/types/lifecycle.types.ts",
        "src/shared/types/settings.types.ts",
        "src/shared/types/toolbar.types.ts",
      ],
      thresholds: {
        statements: 42,
        branches: 37,
        functions: 40,
        lines: 44,
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

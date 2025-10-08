/**
 * Vitest configuration for Solid.js
 * Simplified based on solid-start examples
 */

import { defineConfig } from 'vitest/config';
import solid from 'vite-plugin-solid';
import tsconfigPaths from 'vite-tsconfig-paths';
import { resolve } from 'node:path';
import { fileURLToPath, URL } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  plugins: [
    // Solid.js JSX transform - simple config like solid-start
    solid(),
    // TypeScript path aliases
    tsconfigPaths({ projects: ['tsconfig.json'] }),
  ],

  // Explicit resolve configuration
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@features': resolve(__dirname, './src/features'),
      '@shared': resolve(__dirname, './src/shared'),
      '@assets': resolve(__dirname, './src/assets'),
    },
    conditions: ['browser', 'development'],
  },

  test: {
    // Enable globals
    globals: true,

    // Use JSDOM for DOM testing
    environment: 'jsdom',

    // Setup file
    setupFiles: ['./test/setup.ts'],

    // Test isolation
    isolate: true,

    // Timeouts
    testTimeout: 20000,
    hookTimeout: 25000,

    // JSDOM environment options
    environmentOptions: {
      jsdom: {
        resources: 'usable',
        url: 'https://x.com',
      },
    },

    // Include/exclude patterns
    include: ['test/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/build/**'],
  },
});

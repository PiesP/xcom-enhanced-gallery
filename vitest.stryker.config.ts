import fs from 'fs';
import path from 'path';
import { searchForWorkspaceRoot } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [solidPlugin()],
  define: {
    __DEV__: true,
  },
  server: {
    fs: {
      allow: [
        searchForWorkspaceRoot(process.cwd()),
        fs.realpathSync(path.resolve(process.cwd(), 'node_modules')),
      ],
    },
  },
  resolve: {
    alias: [
      { find: '@features', replacement: path.resolve(process.cwd(), 'src/features') },
      { find: '@shared', replacement: path.resolve(process.cwd(), 'src/shared') },
      { find: '@test', replacement: path.resolve(process.cwd(), 'test') },
      { find: 'scripts', replacement: path.resolve(process.cwd(), 'scripts') },
      { find: '@', replacement: path.resolve(process.cwd(), 'src') },
    ],
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['test/unit/**/*.{test,spec}.{ts,tsx}'],
    setupFiles: ['test/setup.ts'],
    deps: {
      optimizer: {
        web: {
          enabled: true,
        },
      },
    },
    onConsoleLog: () => {
      // console.log('LOG:', log);
    },
  },
});

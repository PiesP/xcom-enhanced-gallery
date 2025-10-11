import { build } from 'esbuild';
import type { Plugin } from 'esbuild';
import { transformAsync } from '@babel/core';
// @ts-expect-error - babel-preset-solid may not have types
import solidPreset from 'babel-preset-solid';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const harnessEntry = path.resolve(__dirname, 'harness', 'index.ts');
const cacheDir = path.resolve(__dirname, '.cache');
const harnessOutput = path.resolve(cacheDir, 'harness.js');

const solidJsxPlugin: Plugin = {
  name: 'solid-jsx',
  setup(build) {
    // First, let esbuild handle TypeScript → JS transformation
    build.onLoad({ filter: /\.(tsx|jsx)$/ }, async args => {
      const source = await fs.readFile(args.path, 'utf8');

      // Use babel to transform JSX with Solid preset
      const result = await transformAsync(source, {
        filename: args.path,
        presets: [
          ['@babel/preset-typescript', { isTSX: true, allExtensions: true }],
          [solidPreset, { generate: 'dom', hydratable: false }],
        ],
        sourceMaps: false,
      });

      return {
        contents: result?.code ?? source,
        loader: 'js',
      };
    });
  },
};

const cssModuleStubPlugin: Plugin = {
  name: 'css-module-stub',
  setup(build) {
    build.onLoad({ filter: /\.module\.css$/ }, async () => ({
      contents:
        'const proxy = new Proxy({}, { get: () => "" }); export default proxy; export const __esModule = true;',
      loader: 'js',
    }));

    build.onLoad({ filter: /\.css$/ }, async () => ({
      contents: '',
      loader: 'css',
    }));
  },
};

async function buildHarness(): Promise<void> {
  await fs.mkdir(cacheDir, { recursive: true });

  await build({
    entryPoints: [harnessEntry],
    outfile: harnessOutput,
    bundle: true,
    format: 'iife',
    platform: 'browser',
    target: ['chrome120'],
    sourcemap: false,
    logLevel: 'silent',
    define: {
      'process.env.NODE_ENV': '"development"',
      'import.meta.env.MODE': '"e2e"',
      'import.meta.env.DEV': '"true"',
      'import.meta.env.PROD': '"false"',
      'import.meta.env.SSR': '"false"',
    },
    plugins: [solidJsxPlugin, cssModuleStubPlugin],
  });

  process.env.XEG_E2E_HARNESS_PATH = harnessOutput;
}

export default async function globalSetup(): Promise<void> {
  await buildHarness();
}

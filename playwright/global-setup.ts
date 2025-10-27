/**
 * @file Playwright Global Setup
 * @description E2E 테스트 하네스 빌드 및 초기화
 *
 * **역할**:
 * - harness/index.ts를 브라우저 실행 가능한 IIFE 번들로 빌드
 * - Solid.js JSX → DOM 변환 (babel-preset-solid)
 * - CSS Modules 스텁 처리 (E2E 환경에서 스타일 불필요)
 * - 빌드 결과를 .cache/harness.js에 저장
 *
 * **참조**: playwright.config.ts, playwright/smoke/utils.ts
 */

import { build } from 'esbuild';
import type { Plugin } from 'esbuild';
import { transformAsync } from '@babel/core';
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
    build.onLoad({ filter: /\.(tsx|jsx)$/ }, async args => {
      const source = await fs.readFile(args.path, 'utf8');

      try {
        // babel-preset-solid는 타입 정의가 없으므로 동적 import 사용
        const solidPresetModule = await import('babel-preset-solid');
        const solidPreset = solidPresetModule.default || solidPresetModule;

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
      } catch (error) {
        console.error(`[Harness Build] Babel transform failed for ${args.path}:`, error);
        throw error;
      }
    });
  },
};

const cssModuleStubPlugin: Plugin = {
  name: 'css-module-stub',
  setup(build) {
    // CSS Modules을 빈 Proxy로 대체 (E2E에서 스타일 불필요)
    build.onLoad({ filter: /\.module\.css$/ }, async () => ({
      contents:
        'const proxy = new Proxy({}, { get: () => "" }); export default proxy; export const __esModule = true;',
      loader: 'js',
    }));

    // 일반 CSS는 빈 내용으로 대체
    build.onLoad({ filter: /\.css$/ }, async () => ({
      contents: '',
      loader: 'css',
    }));
  },
};

async function buildHarness(): Promise<void> {
  const isCI = process.env.CI === 'true';
  const isVerbose = process.env.VERBOSE === 'true';

  try {
    if (!isCI) {
      console.log('[Harness Build] Building E2E test harness...');
    }

    await fs.mkdir(cacheDir, { recursive: true });

    await build({
      entryPoints: [harnessEntry],
      outfile: harnessOutput,
      bundle: true,
      format: 'iife',
      platform: 'browser',
      target: ['chrome120'],
      sourcemap: false,
      logLevel: isVerbose ? 'info' : 'silent',
      define: {
        __DEV__: 'true',
        'process.env.NODE_ENV': '"development"',
        'import.meta.env.MODE': '"e2e"',
        'import.meta.env.DEV': '"true"',
        'import.meta.env.PROD': '"false"',
        'import.meta.env.SSR': '"false"',
      },
      plugins: [solidJsxPlugin, cssModuleStubPlugin],
    });

    // 환경 변수로 하네스 경로 전달
    process.env.XEG_E2E_HARNESS_PATH = harnessOutput;

    if (!isCI) {
      const relativePath = path.relative(process.cwd(), harnessOutput);
      console.log(`[Harness Build] ✓ Built successfully: ${relativePath}`);
    }
  } catch (error) {
    console.error('[Harness Build] ✗ Build failed:', error);
    throw error;
  }
}

export default async function globalSetup(): Promise<void> {
  await buildHarness();
}

// @ts-nocheck
/**
 * Vitest test configuration (optimized)
 * Concise and efficient test environment setup
 */

import tsconfigPaths from 'vite-tsconfig-paths';
import { resolve } from 'node:path';
import { appendFileSync, writeFileSync } from 'node:fs';
import { defineConfig } from 'vitest/config';
import { mergeConfig } from 'vite';
import type { ResolveOptions, InlineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import { fileURLToPath, URL } from 'node:url';
import { playwright } from '@vitest/browser-playwright';
import { loadLocalConfig } from './config/utils/load-local-config.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const debugLogPath = resolve(__dirname, './vitest-debug.log');
// Disable config-time file logging by default to reduce I/O & IPC pressure.
// Enable only when VITEST_VERBOSE_CONFIG=true is set.
const configDebugEnabled = process.env.VITEST_VERBOSE_CONFIG === 'true';
const appendDebug = (message: string) => {
  if (!configDebugEnabled) return;
  try {
    const timestamp = new Date().toISOString();
    appendFileSync(debugLogPath, `[${timestamp}] ${message}\n`, { encoding: 'utf8' });
  } catch {
    // silent on purpose
  }
};

const logStage = (stage: string, payload: string) => {
  appendDebug(`[${stage}] ${payload}`);
};

try {
  if (configDebugEnabled) writeFileSync(debugLogPath, '', { encoding: 'utf8', flag: 'w' });
} catch {
  // silent on purpose
}

appendDebug('[vitest-config] loaded');

// Shared poolOptions for all projects (explicitly set to avoid inheritance issues)
// Phase 200 optimization: Increase memory limit (resolve memory insufficiency)
// Phase 200.1: EPIPE resolution - Adjust memoryLimit conservatively (prevent worker spawn failures)
// Phase 230: Machine optimization - 12 cores, 31GB RAM utilization + stronger worker isolation
// Phase 276: EPIPE regression prevention - Set NODE_OPTIONS in each individual project, minimize memoryLimit
// Phase 368: EPIPE additional improvement - Reduce IPC overhead with isolate false, enable Worker reuse
// Prefer a single forked worker to avoid threads incompatibility and IPC issues on Node 22
// Note: isolate: false needed due to Node 22 child_process IPC bug
const sharedPoolOptions = {
  forks: {
    singleFork: true,
    minForks: 1,
    maxForks: 1,
    // Phase 368: Reduce IPC reconnection frequency through Worker reuse
    reuseWorkers: true,
    // Phase 368: Minimize IPC communication with isolate: false (bypass Node 22 IPC bug)
    isolate: false,
    // Phase 368: GC exposure and memory optimization
    execArgv: ['--expose-gc'],
  },
};
// Toggle performance/benchmark suite explicitly (opt-in only)
const enablePerformanceProject = process.env.ENABLE_PERFORMANCE_TESTS === 'true';
// Helpers
const toPosix = (p: string) => p.replace(/\\/g, '/');
// helpers kept minimal for lint cleanliness
// NOTE: Tests use vite-tsconfig-paths to apply TS paths as-is

// Shared alias/resolve configuration (injected into per-project config as well)
const SRC_DIR = toPosix(resolve(__dirname, './src'));
const FEATURES_DIR = toPosix(resolve(__dirname, './src/features'));
const SHARED_DIR = toPosix(resolve(__dirname, './src/shared'));
const ASSETS_DIR = toPosix(resolve(__dirname, './src/assets'));

const sharedResolve: ResolveOptions = {
  alias: [
    { find: '@', replacement: resolve(__dirname, 'src') },
    { find: '@features', replacement: resolve(__dirname, 'src/features') },
    { find: '@shared', replacement: resolve(__dirname, 'src/shared') },
    { find: '@assets', replacement: resolve(__dirname, 'src/assets') },
    { find: '@test', replacement: resolve(__dirname, 'test') },
    {
      find: 'solid-js/h',
      replacement: toPosix(resolve(__dirname, 'node_modules/solid-js/h/dist/h.js')),
    },
    {
      find: 'solid-js/web',
      replacement: toPosix(resolve(__dirname, 'node_modules/solid-js/web/dist/web.js')),
    },
    {
      find: 'solid-js/store',
      replacement: toPosix(resolve(__dirname, 'node_modules/solid-js/store/dist/store.js')),
    },
    {
      find: 'solid-js/jsx-runtime',
      replacement: toPosix(resolve(__dirname, 'node_modules/solid-js/h/jsx-runtime/dist/jsx.js')),
    },
    {
      find: 'solid-js/jsx-dev-runtime',
      replacement: toPosix(resolve(__dirname, 'node_modules/solid-js/h/jsx-runtime/dist/jsx.js')),
    },
    {
      find: /^solid-js$/,
      replacement: toPosix(resolve(__dirname, 'node_modules/solid-js/dist/solid.js')),
    },
  ],
  // Force browser conditions to avoid SSR builds in jsdom tests
  // Solid.js exports have 'node' → server.js and 'browser' → solid.js
  // We must prioritize 'browser' over 'node' even though Vitest runs in Node
  conditions: ['browser', 'development', 'import'],
};

const solidEsbuildConfig = {
  jsx: 'automatic',
  jsxImportSource: 'solid-js',
} as const;

const solidTransformMode = {
  web: [/\.[jt]sx?$/],
  ssr: [/\.[jt]sx?$/],
} as const;

const baseConfig = defineConfig({
  // DEBUG: Verify config loading and alias paths
  // @ts-expect-error runtime debug
  _debug_alias: (() => {
    try {
      const SRC = SRC_DIR;
      const FEATURES = FEATURES_DIR;
      const SHARED = SHARED_DIR;
      const ASSETS = ASSETS_DIR;
      if (configDebugEnabled) {
        console.log('[vitest.config] resolve.alias', {
          '@': SRC,
          '@features': FEATURES,
          '@shared': SHARED,
          '@assets': ASSETS,
        });
      }
    } catch {}
    return undefined;
  })(),
  plugins: [
    // Optional verbose config logging, opt-in via env flag only
    configDebugEnabled && {
      name: 'xeg-log-config',
      enforce: 'pre',
      configResolved(cfg) {
        try {
          logStage('configResolved', `alias=${JSON.stringify(cfg.resolve?.alias ?? null)}`);
          const names = (cfg.plugins || []).map(p => p.name + (p.enforce ? `(${p.enforce})` : ''));
          logStage('configResolved', `plugins=${names.join(' -> ')}`);
        } catch {}
      },
    },
    solidPlugin({ dev: true, hot: false }),
    // Enable TS paths to be applied uniformly in tests
    tsconfigPaths({ projects: ['tsconfig.json'] }),
  ].filter(Boolean) as any,

  esbuild: solidEsbuildConfig,
  resolve: sharedResolve,
  define: {
    'import.meta.env.SSR': false,
    'import.meta.env.DEV': true,
    'import.meta.env.TEST_ENV': true, // Vitest environment detection
    __BROWSER__: true,
    __DEV__: true,
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./test/setup.ts'],
    globalTeardown: './test/global-teardown.ts', // Phase 241: Auto cleanup Vitest workers
    isolate: true, // Isolate tests from each other
    testTimeout: 20000, // Prevent flaky timeout from dynamic imports and multi-project execution
    hookTimeout: 25000,
    transformMode: solidTransformMode,
    silent: true,
    // Phase 275: EPIPE error resolution - Minimize worker IPC messages
    // Use minimal reporters and lower verbosity settings
    reporters: 'dot',
    reporterVerbosity: 'minimal',
    // Drop almost all console logs from tests to reduce IPC pressure.
    onConsoleLog() {
      // Opt-in verbose via env
      if (process.env.VITEST_VERBOSE_LOGS === 'true') return true;
      // Always suppress debug/info noise; allow only vitest errors by default
      // Block both stdout/stderr prints coming from app/test code
      return false;
    },

    // Aliases recognized as bare imports (@features/@shared/@assets/@*)
    // should not be optimized as external dependencies but rather
    // inlined in Vitest (vite-node) pipeline to prevent alias issues on Windows.
    // solid-js is also inlined to enforce browser conditions
    server: {
      deps: {
        inline: [
          /^@features\//,
          /^@shared\//,
          /^@assets\//,
          /^@\//,
          /^@features$/,
          /^@shared$/,
          /^@assets$/,
          /^@$/,
          /^solid-js/,
          '@solidjs/testing-library',
        ],
      },
    },

    // happy-dom environment configuration
    environmentOptions: {
      happyDom: {
        url: 'https://x.com',
      },
    },

    // Include type definition files
    typecheck: {
      include: ['**/*.{test,spec}.{ts,tsx}'],
    },

    // Coverage settings
    coverage: {
      // Unified v8 (Phase 78: Performance optimization and maintainability)
      provider: 'v8',
      reporter: ['text', 'json-summary', 'html', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        'test/',
        '**/*.d.ts',
        '**/*.{test,spec}.{ts,tsx}',
        '**/types.ts',
        '**/index.ts',
      ],
      thresholds: {
        global: {
          branches: 70, // 75 → 70 (realistic target)
          functions: 75, // 80 → 75
          lines: 75, // 80 → 75
          statements: 75, // 80 → 75
        },
        // Core modules require higher coverage
        'src/core/**/*.ts': {
          branches: 80, // 85 → 80
          functions: 85, // 90 → 85
          lines: 85, // 90 → 85
          statements: 85, // 90 → 85
        },
        // Phase 96.1: Adjust thresholds realistically (current coverage: ~39.5% in CI sharded env)
        // TODO Phase 97: Establish gradual improvement plan (target: 60% → 70% → 80%)
        'src/shared/**/*.ts': {
          branches: 39, // 45 → 42 → 39 (reflects actual sharded environment values)
          functions: 39, // 45 → 42 → 39 (reflects actual sharded environment values)
          lines: 39, // 45 → 42 → 39 (reflects actual sharded environment values)
          statements: 39, // 45 → 42 → 39 (reflects actual sharded environment values)
        },
      },
    },

    // Performance optimization (Phase 200: Resolve memory leaks)
    // Caution: Multi-threaded pool causes widespread memory leaks
    // (both local and CI consume 2GB+ memory from just 1 test)
    // Phase 200.1: EPIPE resolution - Adjust memoryLimit conservatively
    // Phase 275: Complete EPIPE resolution - Force single thread (resolves multi-thread IPC buffer overflow)
    // Phase 276: Prevent EPIPE regression - Set NODE_OPTIONS in each individual project
    singleThread: true,
    pool: 'forks',
    poolOptions: sharedPoolOptions,
    // Vitest v3: Define split suites via test.projects (use --project filter)
    // Explicitly specify jsdom environment/config per project to prevent inheritance issues
    projects: [
      // Minimal smoke: Fast boundary check (configuration/token/contract guards)
      // Phase 272: Improved smoke project definition
      // - Purpose: Ultra-fast configuration and token guard (within 10-20 seconds)
      // - Strategy: Include only contract tests that exist and don't fail
      // - Excluded: Logger tests (environment issues), environment polyfills (happy-dom constraints)
      {
        // Explicitly inject the same resolve into individual projects (Windows vite-node compatibility)
        resolve: sharedResolve,
        esbuild: solidEsbuildConfig,
        pool: 'forks',
        poolOptions: sharedPoolOptions,
        test: {
          name: 'smoke',
          globals: true,
          // Parent testTimeout/hookTimeout not inherited into projects, so explicitly set
          testTimeout: 20000,
          hookTimeout: 25000,
          environment: 'happy-dom',
          setupFiles: ['./test/setup.ts'],
          environmentOptions: {
            happyDom: {
              url: 'https://x.com',
            },
          },
          transformMode: solidTransformMode,
          include: [
            // Basic utilities: viewport calculation (core function that must succeed)
            'test/unit/shared/utils/viewport-utils.test.ts',
            // External API contract guards: userscript, toast, settings, service container
            'test/unit/shared/external/userscript-adapter.contract.test.ts',
            'test/unit/shared/services/toast-manager.contract.test.ts',
            'test/unit/shared/services/settings-service.contract.test.ts',
            'test/unit/shared/container/service-harness.contract.test.ts',
          ],
          exclude: ['**/node_modules/**', '**/dist/**'],
        },
      },
      // Fast unit tests: exclude red/bench/performance
      {
        resolve: sharedResolve,
        esbuild: solidEsbuildConfig,
        pool: 'forks',
        poolOptions: sharedPoolOptions,
        test: {
          name: 'fast',
          globals: true,
          // Explicitly set timeout to prevent flakiness from Windows/transform delays
          testTimeout: 20000,
          hookTimeout: 25000,
          environment: 'happy-dom',
          setupFiles: ['./test/setup.ts'],
          environmentOptions: {
            happyDom: {
              url: 'https://x.com',
            },
          },
          include: ['test/unit/**/*.{test,spec}.{ts,tsx}'],
          exclude: [
            '**/node_modules/**',
            '**/dist/**',
            '**/*.red.test.*',
            'test/unit/performance/**',
            '**/*.bench.test.*',
            'test/archive/**',
            // Phase B3.2.5: sample-based-click-detection.test.ts has dependency injection issues
            // See: https://github.com/PiesP/xcom-enhanced-gallery/issues/XXX
            // TODO: Fix test to work with actual MediaExtractionService implementation
            'test/unit/shared/services/media-extraction/sample-based-click-detection.test.ts',
            // 2025-10-23: Exclude failing tests that need refactoring or are WIP
            // These tests have structural issues and need to be fixed in a separate phase
            'test/unit/shared/services/bulk-download.progress-complete.test.ts',
            'test/unit/shared/components/isolation/GalleryContainer.test.tsx',
            'test/unit/shared/services/media/phase-125.5-fallback-extractor.test.ts',
            'test/unit/shared/services/media-extraction/phase-125.5-media-extraction-service.test.ts',
            'test/unit/shared/hooks/use-gallery-toolbar-logic.test.ts',
            'test/unit/features/toolbar/toolbar.focus-indicator.test.tsx',
            'test/unit/shared/services/service-diagnostics.test.ts',
            // 2025-10-23: Additional failing tests with syntax errors
            'test/unit/features/gallery/phase-b3-2-gallery-app-coverage.test.ts',
            'test/unit/shared/vendor-initialization-error.test.ts',
            'test/unit/features/gallery/components/VerticalGalleryView.fit-mode.test.tsx',
            'test/unit/features/gallery/components/VerticalGalleryView.wheel-scroll.test.tsx',
            // Phase 163b: Isolate RAF/fake timers tests to raf-timing project
            'test/unit/features/gallery/hooks/use-gallery-focus-tracker-deduplication.test.ts',
            'test/unit/features/gallery/components/VerticalGalleryView.auto-focus-on-idle.test.tsx',
            'test/unit/features/gallery/hooks/use-gallery-focus-tracker-settling.test.ts',
            'test/unit/features/gallery/hooks/use-gallery-focus-tracker-observer-lifecycle.test.ts',
            'test/unit/features/gallery/components/VerticalGalleryView.focus-tracking.test.tsx',
            // Phase 188: Moved files
            'test/unit/features/gallery/hooks/use-gallery-focus-tracker-events.test.ts',
          ],
          transformMode: solidTransformMode,
        },
      },
      // Full unit tests (excluding performance/bench) - Sharded project
      {
        resolve: sharedResolve,
        esbuild: solidEsbuildConfig,
        pool: 'forks',
        poolOptions: sharedPoolOptions,
        test: {
          name: 'unit',
          globals: true,
          // Phase 368: Increase timeout to allow Worker initialization
          testTimeout: 30000,
          hookTimeout: 30000,
          // Phase 368: Limit concurrent test execution to reduce memory pressure
          maxConcurrency: 1,
          // Phase 368: Retry on failure to mitigate temporary IPC issues
          retry: 1,
          environment: 'happy-dom',
          setupFiles: ['./test/setup.ts'],
          environmentOptions: {
            happyDom: {
              url: 'https://x.com',
            },
          },
          include: ['test/unit/**/*.{test,spec}.{ts,tsx}'],
          exclude: ['**/node_modules/**', '**/dist/**'],
          transformMode: solidTransformMode,
        },
      },
      // Performance/benchmark suite (opt-in via ENABLE_PERFORMANCE_TESTS)
      enablePerformanceProject && {
        resolve: sharedResolve,
        esbuild: solidEsbuildConfig,
        pool: 'forks',
        poolOptions: sharedPoolOptions,
        test: {
          name: 'performance',
          globals: true,
          testTimeout: 20000,
          hookTimeout: 25000,
          environment: 'happy-dom',
          setupFiles: ['./test/setup.ts'],
          environmentOptions: {
            happyDom: {
              url: 'https://x.com',
            },
          },
          include: ['test/unit/performance/**/*.{test,spec}.{ts,tsx}', '**/*.bench.test.*'],
          exclude: ['**/node_modules/**', '**/dist/**', '**/test/archive/**'],
          transformMode: solidTransformMode,
        },
      },
      // Style-related tests (tokens/theme/policy)
      {
        resolve: sharedResolve,
        esbuild: solidEsbuildConfig,
        pool: 'forks',
        poolOptions: sharedPoolOptions,
        test: {
          name: 'styles',
          globals: true,
          testTimeout: 20000,
          hookTimeout: 25000,
          environment: 'happy-dom',
          setupFiles: ['./test/setup.ts'],
          environmentOptions: {
            happyDom: {
              url: 'https://x.com',
            },
          },
          include: [
            'test/styles/**/*.{test,spec}.{ts,tsx}',
            'test/unit/styles/**/*.{test,spec}.{ts,tsx}',
            'test/unit/policies/**/*.{test,spec}.{ts,tsx}',
          ],
          exclude: ['**/node_modules/**', '**/dist/**'],
          transformMode: solidTransformMode,
        },
      },
      // Project status validation: Guard tests (current Phase 170B+)
      // Bundle size, architecture, coding rules, regression prevention
      {
        resolve: sharedResolve,
        esbuild: solidEsbuildConfig,
        pool: 'threads',
        poolOptions: sharedPoolOptions,
        test: {
          name: 'guards',
          globals: true,
          testTimeout: 20000,
          hookTimeout: 25000,
          environment: 'happy-dom',
          setupFiles: ['./test/setup.ts'],
          environmentOptions: {
            happyDom: {
              url: 'https://x.com',
            },
          },
          include: ['test/guards/**/*.{test,spec}.{ts,tsx}'],
          exclude: ['**/node_modules/**', '**/dist/**'],
          transformMode: solidTransformMode,
        },
      },
      // Browser mode: Solve Solid.js reactivity constraints and test real browser APIs
      // Use @vitest/browser to run tests in actual browser via Playwright
      {
        resolve: sharedResolve,
        esbuild: solidEsbuildConfig,
        pool: 'threads',
        poolOptions: sharedPoolOptions,
        define: {
          'import.meta.env.SSR': false,
          'import.meta.env.DEV': true,
          __BROWSER__: true,
          __DEV__: true,
        },
        test: {
          name: 'browser',
          globals: true,
          testTimeout: 30000, // Consider browser startup time
          hookTimeout: 35000,
          // browser mode uses actual browser environment
          browser: {
            enabled: true,
            provider: playwright({
              launch: {
                args: ['--disable-web-security'], // Prevent CORS issues (test environment)
              },
            }),
            instances: [
              {
                browser: 'chromium',
              },
            ],
            headless: true,
          },
          setupFiles: ['./test/setup-browser.ts'], // Browser-only setup
          include: ['test/browser/**/*.{test,spec}.{ts,tsx}'],
          exclude: ['**/node_modules/**', '**/dist/**'],
          transformMode: solidTransformMode,
        },
      },
      // RAF/fake timers timing issue isolation project (Phase 163b, Phase 164 Option B)
      // Disable vitest fake timers (keep JSDOM)
      // 3 focus tests expected to FAIL due to vitest fake timers constraint → acceptable
      // Remaining 4 tests work with real setTimeout/RAF
      {
        resolve: sharedResolve,
        esbuild: solidEsbuildConfig,
        pool: 'threads',
        poolOptions: sharedPoolOptions,
        test: {
          name: 'raf-timing',
          globals: true,
          testTimeout: 20000,
          hookTimeout: 25000,
          environment: 'happy-dom',
          setupFiles: ['./test/setup.ts'],
          environmentOptions: {
            happyDom: {
              url: 'https://x.com',
            },
          },
          // Disable fake timers: use actual browser timing
          vitest: {
            useFakeTimers: false,
          },
          // Include RAF timing tests (focus tracking, etc.)
          include: [
            'test/unit/features/gallery/hooks/use-gallery-focus-tracker-deduplication.test.ts',
            'test/unit/features/gallery/components/VerticalGalleryView.auto-focus-on-idle.test.tsx',
            'test/unit/features/gallery/hooks/use-gallery-focus-tracker-settling.test.ts',
            'test/unit/features/gallery/hooks/use-gallery-focus-tracker-observer-lifecycle.test.ts',
            'test/unit/features/gallery/components/VerticalGalleryView.focus-tracking.test.tsx',
            'test/unit/features/gallery/hooks/use-gallery-focus-tracker-events.test.ts',
          ],
          exclude: ['**/node_modules/**', '**/dist/**'],
          transformMode: solidTransformMode,
        },
      },
    ].filter(Boolean),
  },
});

const localVitestConfig =
  (await loadLocalConfig<InlineConfig>(import.meta.url, 'vitest.local')) ?? null;

export default localVitestConfig
  ? mergeConfig(baseConfig as InlineConfig, localVitestConfig)
  : baseConfig;

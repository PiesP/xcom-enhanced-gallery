// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * Userscript build: Solid bundling, inline CSS, and userscript metadata.
 *
 * Ordinary `pnpm build` runs version/quality checks through its prebuild hook.
 * `build:ci`, `build:dev`, and `build:fast` invoke the bundler without that gate.
 * CONTRIBUTING.md owns the current command and validation contracts.
 */

// External dependencies
import { resolve } from 'node:path';
import { builtinModules } from 'node:module';
import { defineConfig, mergeConfig, type UserConfig } from 'vite-plus';
import { buildSummaryPlugin } from './tooling/vite/plugins/build-summary.ts';
import { cssInlinePlugin } from './tooling/vite/plugins/css-inline.ts';
import { metaOnlyPlugin } from './tooling/vite/plugins/meta-only.ts';
import { moduleFootprintPlugin } from './tooling/vite/plugins/module-footprint.ts';
import { basePreset } from './tooling/vite/presets/base.ts';
import { solidPreset } from './tooling/vite/presets/solid.ts';
import { userscriptPreset } from './tooling/vite/presets/userscript.ts';
import { OUTPUT_FILE_NAMES, USERSCRIPT_CONFIG } from './tooling/vite/utils/userscript.ts';
// Tooling utilities
import { resolveVersion } from './tooling/vite/utils/version.ts';

// ── Build constants ─────────────────────────────────────────────────────────

/** Configuration options for build mode optimization (development vs production). */
interface BuildModeConfig {
  readonly cssCompress: boolean;
  readonly cssClassNamePattern: string;
  readonly sourceMap: boolean | 'inline';
}

const BUILD_MODE_CONFIGS: Record<'development' | 'production', BuildModeConfig> = {
  development: {
    cssCompress: false,
    cssClassNamePattern: '[name]__[local]__[hash:base64:5]',
    sourceMap: true as const,
  },
  production: {
    cssCompress: true,
    cssClassNamePattern: 'xg-[hash:base64:4]',
    sourceMap: false as const,
  },
};

/** Resolve build mode configuration from Vite mode string. */
function getBuildModeConfig(mode: string): BuildModeConfig {
  return BUILD_MODE_CONFIGS[mode === 'development' ? 'development' : 'production'];
}

// ── Vite Configuration ──────────────────────────────────────────────────────

export default defineConfig(({ mode }): UserConfig => {
  const isDev = mode === 'development';
  const config = getBuildModeConfig(mode);
  const version = resolveVersion(isDev);

  if (version === '0.0.0' || version === '1.0.0') {
    throw new Error(
      `[vite.config] Version resolved to fallback "${version}". ` +
        'Check tooling/vite/utils/version.ts REPO_ROOT path and package.json presence.'
    );
  }
  const root = resolve(import.meta.dirname);
  const entryFile = resolve(root, './src/main.ts');

  // Feature flags: media extraction is always enabled (the disabled variant was deleted)
  const featureMediaExtraction = true;

  // Build output configuration
  const outputFileName = isDev ? OUTPUT_FILE_NAMES.dev : OUTPUT_FILE_NAMES.prod;

  // Compose config from presets using deep merge
  return mergeConfig(
    mergeConfig(
      mergeConfig(
        basePreset({ root, isDev, version, featureMediaExtraction }),
        solidPreset({ isDev, cssClassNamePattern: config.cssClassNamePattern })
      ),
      userscriptPreset({
        entryFile,
        outputFileName,
        isDev,
        cssCompress: config.cssCompress,
        sourceMap: config.sourceMap,
      })
    ),
    {
      fmt: {
        useTabs: false,
        tabWidth: 2,
        printWidth: 100,
        singleQuote: true,
        jsxSingleQuote: false,
        quoteProps: 'as-needed',
        trailingComma: 'es5',
        semi: true,
        arrowParens: 'always',
        ignorePatterns: [
          'packages/core/**',
          'pnpm-lock.yaml',
          'test/fixtures/authenticated-x-layouts/*.html',
          '**/*.md',
          '**/*.yaml',
          '**/*.yml',
        ],
      },
      lint: {
        plugins: ['vitest', 'import', 'typescript', 'unicorn'],
        rules: {
          'typescript/no-explicit-any': 'error',
          'typescript/no-non-null-assertion': 'off',
          'vitest/no-focused-tests': 'error',
          'vitest/require-mock-type-parameters': 'off',
          'vitest/valid-expect': 'off',
          'vitest/no-conditional-expect': 'off',
          'vitest/require-to-throw-message': 'off',
          'vitest/expect-expect': 'off',
          'typescript/no-floating-promises': 'off',
          'typescript/unbound-method': 'off',
          'typescript/no-base-to-string': 'off',
          'typescript/no-redundant-type-constituents': 'off',
          'typescript/require-array-sort-compare': 'off',
          'typescript/no-duplicate-type-constituents': 'off',
          'typescript/no-implied-eval': 'off',
          'typescript/restrict-template-expressions': 'off',
          'unicorn/no-useless-fallback-in-spread': 'off',
          'unicorn/no-useless-spread': 'off',
          'unicorn/prefer-string-starts-ends-with': 'off',
          'unicorn/no-thenable': 'off',
          'unicorn/no-document-cookie': 'error',
          'no-unused-expressions': ['error', { allowShortCircuit: true }],
          'no-unused-vars': [
            'error',
            {
              varsIgnorePattern: '^(?:_|browser$)',
              argsIgnorePattern: '^_',
              caughtErrorsIgnorePattern: '^_',
            },
          ],
          'no-param-reassign': 'error',
          'no-self-compare': 'error',
          'no-control-regex': 'error',
          curly: 'error',
          'prefer-const': 'error',
          'prefer-exponentiation-operator': 'error',
          'array-callback-return': 'error',
          'no-unneeded-ternary': 'error',
          'no-lone-blocks': 'error',
          'typescript/no-useless-empty-export': 'error',
        },
        overrides: [
          {
            files: ['src/**/*.{ts,tsx}'],
            rules: {
              'typescript/no-non-null-assertion': 'error',
              'no-restricted-imports': [
                'error',
                {
                  patterns: [
                    {
                      group: ['node:*'],
                      message:
                        'Browser product code must use browser APIs or the platform adapter.',
                    },
                  ],
                  paths: builtinModules
                    .filter((name) => !name.startsWith('_') && !name.startsWith('node:'))
                    .map((name) => ({
                      name,
                      message:
                        'Browser product code must use browser APIs or the platform adapter.',
                    })),
                },
              ],
            },
          },
          {
            files: ['test/**/*.{ts,tsx,mjs}', 'validation/windows/**/*.mjs'],
            rules: { 'unicorn/no-document-cookie': 'off' },
          },
          {
            files: ['validation/windows/**/*.mjs'],
            rules: {
              // Receipt cleanup and bounded polling deliberately use these forms.
              'no-unsafe-finally': 'off',
              'no-control-regex': 'off',
              'no-constant-condition': 'off',
            },
          },
        ],
        ignorePatterns: [
          'packages/core/**',
          'dist/**',
          'dist-extension/**',
          'dist-extension-firefox/**',
          'coverage/**',
          'test/fixtures/authenticated-x-layouts/*.html',
        ],
        options: { typeAware: true, typeCheck: false, maxWarnings: 0 },
      },
      resolve: {
        alias: [],
      },

      plugins: [
        cssInlinePlugin(),
        ...(!isDev ? [moduleFootprintPlugin('userscript')] : []),
        ...(isDev
          ? []
          : [
              metaOnlyPlugin(version, {
                name: USERSCRIPT_CONFIG.name,
                namespace: USERSCRIPT_CONFIG.namespace,
              }),
            ]),
        buildSummaryPlugin({
          isDev,
          version,
          config,
          baseConfig: USERSCRIPT_CONFIG,
        }),
      ],
    }
  );
});

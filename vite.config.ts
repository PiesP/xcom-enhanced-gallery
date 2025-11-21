/**
 * Vite configuration file — single userscript bundle generation. Source maps generated for dev/prod (for debugging/validation).
 * - Dev build: human-readable version tag (timestamp) + uncompressed (debugging convenience).
 * - Prod build: terser compression (console/debugger removed), license notice injection, bundle size optimization.
 * - Output: final userscript file (and sourcemap) written to dist/ and temporary/asset files cleaned up.
 */
import { defineConfig, mergeConfig } from 'vite';
import type { Plugin, UserConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import solidPlugin from 'vite-plugin-solid';
import { visualizer } from 'rollup-plugin-visualizer';
import fs from 'node:fs';
import path from 'node:path';
import type { OutputBundle, OutputChunk, OutputAsset, NormalizedOutputOptions } from 'rollup';
import { transformSync } from '@babel/core';

// Local config loader (local only, skipped in CI)
// noinspection JSUnusedLocalSymbols
async function loadLocalConfigSafe<T = unknown>(): Promise<T | null> {
  // Skip if CI environment or XEG_DISABLE_LOCAL_CONFIG is set
  if (process.env.XEG_DISABLE_LOCAL_CONFIG === 'true' || process.env.CI === 'true') {
    return null;
  }

  try {
    // Dynamic import to load only if file exists (resolve file absence in CI)
    const { loadLocalConfig } = (await import('./config/utils/load-local-config')) as {
      loadLocalConfig: <T = unknown>() => Promise<T | null>;
    };
    return (await loadLocalConfig<T>()) ?? null;
  } catch {
    // Return null if file doesn't exist or other error occurs (continue build)
    return null;
  }
}

interface BuildFlags {
  mode: string;
  isDev: boolean;
  isProd: boolean;
  sourcemap: boolean;
}

interface PackageJsonMeta {
  version: string;
  description?: string;
}

function resolveFlags(mode: string): BuildFlags {
  const isDev = mode === 'development';
  // Policy: Generate sourcemap only for dev builds to support debugging. Production prioritizes file size minimization.
  return { mode, isDev, isProd: !isDev, sourcemap: isDev };
}

const pkg: PackageJsonMeta = JSON.parse(fs.readFileSync('./package.json', 'utf8'));

/**
 * Read external library license text from LICENSES/ and insert as comment at the top of userscript.
 * If file is missing or read fails, leave a warning and continue (do not stop build).
 */
function generateLicenseNotices(): string {
  const licenseFiles = [
    { path: './LICENSES/solid-js-MIT.txt', name: 'Solid.js' },
    { path: './LICENSES/heroicons-MIT.txt', name: 'Heroicons' },
  ];

  let notices = '/*\n * Third-Party Licenses\n * ====================\n';

  for (const { path: licensePath, name } of licenseFiles) {
    try {
      if (fs.existsSync(licensePath)) {
        const content = fs.readFileSync(licensePath, 'utf8');
        notices += ` *\n * ${name}:\n`;
        notices += content
          .split('\n')
          .map(line => ` * ${line}`.trimEnd())
          .join('\n');
        notices += '\n';
      }
    } catch (error) {
      console.warn(`[license] Failed to read license file for ${name}:`, error);
    }
  }

  notices += ' */\n';
  return notices;
}

function userscriptHeader(flags: BuildFlags): string {
  // Dev version tag: YYYY.MMDD.HHmmss.SSS (for convenient build identification)
  // Production uses version from package.json.
  // Includes userscript meta fields (permissions, match, update/download URLs, etc).
  // Dev build uses human-readable version format: YYYY.MMDD.HHmmss.SSS
  const devTimestamp = (() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const sec = String(now.getSeconds()).padStart(2, '0');
    const ms = String(now.getMilliseconds()).padStart(3, '0');
    return `${year}.${month}${day}.${hour}${min}${sec}.${ms}`;
  })();
  const version = flags.isDev ? `${pkg.version}-dev.${devTimestamp}` : pkg.version;
  const devSuffix = flags.isDev ? ' (Dev)' : '';
  return (
    `// ==UserScript==\n` +
    `// @name         X.com Enhanced Gallery${devSuffix}\n` +
    `// @namespace    https://github.com/piesp/xcom-enhanced-gallery\n` +
    `// @version      ${version}\n` +
    `// @description  ${pkg.description || ''}\n` +
    `// @author       PiesP\n` +
    `// @license      MIT\n` +
    `// @match        https://*.x.com/*\n` +
    `// @grant        GM_setValue\n` +
    `// @grant        GM_getValue\n` +
    `// @grant        GM_download\n` +
    `// @grant        GM_notification\n` +
    `// @connect      pbs.twimg.com\n` +
    `// @connect      video.twimg.com\n` +
    `// @connect      api.twitter.com\n` +
    `// @run-at       document-idle\n` +
    `// @supportURL   https://github.com/piesp/xcom-enhanced-gallery/issues\n` +
    `// @downloadURL  https://github.com/piesp/xcom-enhanced-gallery/releases/latest/download/xcom-enhanced-gallery.user.js\n` +
    `// @updateURL    https://github.com/piesp/xcom-enhanced-gallery/releases/latest/download/xcom-enhanced-gallery.user.js\n` +
    `// @noframes\n` +
    `// ==/UserScript==\n`
  );
}

/**
 * Generate safe code to inject CSS into DOM at build time
 *
 * @param css - CSS string generated by Vite at build time (trusted input)
 * @param isDev - Whether this is a dev build (determines formatting)
 *                - true: Pretty output (for easier debugging)
 *                - false: Compact output (minimize final bundle size)
 * @returns JavaScript code for style injection
 *
 * @security This function runs only at build time and does not receive runtime user input.
 *           - Dev: JSON.stringify() automatically escapes special characters
 *           - Prod: Base64 ensures binary safety
 */
function createStyleInjector(css: string, isDev: boolean = false): string {
  if (!css.trim()) {
    return '';
  }

  if (isDev) {
    // 📝 Dev build: Use plain CSS (directly viewable in DevTools)
    // JSON.stringify() automatically escapes all special characters ('", \n, \t, etc).
    return `(function() {
  try {
    var s = document.getElementById('xeg-styles');
    if (s) s.remove();
    s = document.createElement('style');
    s.id = 'xeg-styles';
    s.textContent = ${JSON.stringify(css)};
    (document.head || document.documentElement).appendChild(s);
  } catch (e) {
    console.error('[XEG] style inject fail', e);
  }
})();`;
  } else {
    // 🔒 Production build: Inline CSS directly to avoid Base64 overhead (smaller bundle)
    // CSS content is already processed by PostCSS/CSSNano, so additional minification is unnecessary here.
    const serializedCss = JSON.stringify(css);
    return (
      `(function(){` +
      `try{` +
      `var s=document.getElementById('xeg-styles');` +
      `if(s) s.remove();` +
      `s=document.createElement('style');` +
      `s.id='xeg-styles';` +
      `s.textContent=${serializedCss};` +
      `(document.head||document.documentElement).appendChild(s);` +
      `}catch(e){console.error('[XEG] style inject fail',e);}` +
      `})();`
    );
  }
}

/**
 * Generate UserScript wrapper code at build time
 *
 * @param options - Wrapper generation options
 * @param options.header - UserScript meta block
 * @param options.license - License text (optional)
 * @param options.styleInjector - Style injection code
 * @param options.code - Bundled application code
 * @param options.isProd - Whether this is a production build
 * @returns Complete UserScript code
 *
 * @security This function runs only at build time and all inputs are
 *           trusted strings generated by the build process. It does not include
 *           runtime user input.
 */
function createUserscriptWrapper(options: {
  header: string;
  license: string;
  styleInjector: string;
  code: string;
  isProd: boolean;
}): string {
  const { header, license, styleInjector, code, isProd } = options;

  if (isProd) {
    // Production: Single-line minimized format (except meta block)
    return `${header}${license}${styleInjector}${code}`;
  } else {
    // Development: Multiple lines with indentation for readability
    // - License: Keep as-is (multi-line)
    // - Style injector: Add line breaks
    // - Application code: Wrap in IIFE and add line breaks
    return (
      `${header}` +
      `${license}` +
      `${styleInjector}\n` +
      `(function() {\n` +
      `'use strict';\n` +
      `${code}\n` +
      `})();`
    );
  }
}

function userscriptPlugin(flags: BuildFlags): Plugin {
  return {
    name: 'xeg-userscript-wrapper',
    apply: 'build',
    writeBundle(options: NormalizedOutputOptions, bundle: OutputBundle) {
      // Determine outDir and aggregate bundle items (CSS, entry chunk, sourcemap)
      const outDir = options.dir ?? 'dist';
      let cssConcat = '';
      let entryChunk: OutputChunk | undefined;
      let sourcemapContent = '';

      // Process all bundle items
      for (const fileName of Object.keys(bundle)) {
        const item = bundle[fileName];
        if (!item) continue;

        if (fileName.endsWith('.css') && item.type === 'asset') {
          const asset = item as OutputAsset;
          if (typeof asset.source === 'string') {
            cssConcat += asset.source;
          }
        } else if (fileName.endsWith('.js.map') && item.type === 'asset') {
          const asset = item as OutputAsset;
          if (typeof asset.source === 'string') {
            sourcemapContent = asset.source;
          }
        } else if (item.type === 'chunk' && item.isEntry) {
          entryChunk = item as OutputChunk;
          if (entryChunk.map && flags.isDev) {
            sourcemapContent = JSON.stringify(entryChunk.map);
          }
        }
      }

      if (!entryChunk) {
        console.warn('[userscript] entry chunk not found');
        return;
      }

      // Generate style injection code (at build time)
      // Dev build: Multiple lines for CSS debugging convenience
      // Prod build: Single minimized line for optimization
      const styleInjector = createStyleInjector(cssConcat, flags.isDev);

      // Remove sourceMappingURL comments that may remain in entry code
      // to prevent duplicate comments in userscript file.
      const cleanedCode = entryChunk.code
        .replace(/\/\/#\s*sourceMappingURL\s*=.*$/gm, '')
        .replace(/\/\*#\s*sourceMappingURL\s*=.*?\*\//gs, '');

      // For production builds only, inject external license text as comment at top.
      const licenseNotices = flags.isProd ? generateLicenseNotices() : '';

      // Generate complete userscript wrapper (at build time)
      const wrapped = createUserscriptWrapper({
        header: userscriptHeader(flags),
        license: licenseNotices,
        styleInjector: styleInjector,
        code: cleanedCode,
        isProd: flags.isProd,
      });

      const finalName = flags.isDev
        ? 'xcom-enhanced-gallery.dev.user.js'
        : 'xcom-enhanced-gallery.user.js';

      fs.writeFileSync(path.join(outDir, finalName), wrapped, 'utf8');

      // For dev builds only, write sourcemap file separately (for debugging).
      if (flags.isDev && sourcemapContent) {
        const mapName = 'xcom-enhanced-gallery.dev.user.js.map';
        fs.writeFileSync(path.join(outDir, mapName), sourcemapContent, 'utf8');
        // Add sourceMappingURL comment at end of file (for debugging convenience)
        try {
          const suffix = `\n//# sourceMappingURL=${mapName}`;
          fs.appendFileSync(path.join(outDir, finalName), suffix, 'utf8');
        } catch {}
        console.log(`✅ Sourcemap generated: ${mapName}`);
      }

      console.log(`✅ Userscript generated: ${finalName}`);

      // Remove temp asset directories like dist/assets (goal is single userscript output).
      const assetsDir = path.join(outDir, 'assets');
      if (fs.existsSync(assetsDir)) {
        fs.rmSync(assetsDir, { recursive: true, force: true });
      }

      // Clean up unnecessary files
      const unnecessaryFiles = ['_cleanup_marker'];
      for (const file of unnecessaryFiles) {
        const filePath = path.join(outDir, file);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

      console.log('🗑️ Cleanup of unnecessary files complete');
    },
  };
}

function stripLoggerDebugPlugin(flags: BuildFlags): Plugin | null {
  if (!flags.isProd) {
    return null;
  }

  return {
    name: 'xeg-strip-logger-debug',
    enforce: 'pre',
    transform(code, id) {
      // Skip node_modules
      if (id.includes('node_modules')) {
        return null;
      }
      // Process only TypeScript/JS sources
      if (!/\.(ts|tsx|js|jsx)$/.test(id)) {
        return null;
      }
      // Remove logger.debug / logger.info calls through Babel transformation
      // while preserving code structure where possible.
      // Goal: Minimize production bundle size and exposed debug logs.
      // Complex expressions with side effects are safely replaced with undefined.
      const result = transformSync(code, {
        filename: id,
        babelrc: false,
        configFile: false,
        sourceMaps: true,
        parserOpts: {
          sourceType: 'module',
          plugins: ['typescript', 'jsx'],
        },
        plugins: [
          ({ types: t }) => ({
            name: 'strip-logger-debug-call',
            visitor: {
              CallExpression(path: any) {
                const callee = path.node.callee;
                if (
                  t.isMemberExpression(callee) &&
                  !callee.computed &&
                  // Remove debug/info log calls for prod bundle size reduction
                  (t.isIdentifier(callee.property, { name: 'debug' }) ||
                    t.isIdentifier(callee.property, { name: 'info' }))
                ) {
                  if (path.parentPath?.isExpressionStatement()) {
                    path.parentPath.remove();
                  } else {
                    path.replaceWith(t.identifier('undefined'));
                  }
                }
              },
            },
          }),
        ],
      });

      if (!result) {
        return null;
      }

      return {
        code: result.code ?? code,
        map: result.map ?? null,
      };
    },
  };
}

export default defineConfig(async ({ mode }) => {
  const flags = resolveFlags(mode);
  const shouldEnableBundleAnalysis =
    flags.isProd && process.env.XEG_ENABLE_BUNDLE_ANALYSIS === 'true';
  const config: UserConfig = {
    plugins: [
      stripLoggerDebugPlugin(flags),
      solidPlugin({ dev: flags.isDev, ssr: false }),
      tsconfigPaths({ projects: ['tsconfig.json'] }),
      userscriptPlugin(flags),
      // Bundle analysis (opt-in via XEG_ENABLE_BUNDLE_ANALYSIS)
      shouldEnableBundleAnalysis &&
        visualizer({
          filename: 'docs/bundle-analysis.html',
          open: false,
          gzipSize: true,
          brotliSize: true,
          template: 'treemap', // or 'sunburst', 'network'
        }),
    ].filter(Boolean) as Plugin[],
    define: {
      __DEV__: flags.isDev,
      __IS_DEV__: flags.isDev,
      __VERSION__: JSON.stringify(pkg.version),
      'process.env.NODE_ENV': JSON.stringify(flags.isProd ? 'production' : 'development'),
      'process.env': '{}',
      global: 'globalThis',
      // Phase 326.5: Feature Flags for optional modules (Boolean, not string)
      __FEATURE_MEDIA_EXTRACTION__: process.env.ENABLE_MEDIA_EXTRACTION !== 'false',
    },
    esbuild: {
      jsx: 'preserve',
      jsxImportSource: 'solid-js',
      // Phase 230: esbuild parallel processing optimization
      tsconfigRaw: {
        compilerOptions: {
          useDefineForClassFields: false, // Solid.js compatibility
        },
      },
    },
    resolve: {
      extensions: ['.mjs', '.js', '.ts', '.tsx', '.jsx', '.json'],
      alias: [
        { find: '@features', replacement: '/src/features' },
        { find: '@shared', replacement: '/src/shared' },
        { find: '@assets', replacement: '/src/assets' },
        { find: '@', replacement: '/src' },
      ],
    },
    css: {
      modules: {
        // Phase 308: CSS class name abbreviation saves 1-2 KB
        // Prod: [hash:base64:8] → [hash:base64:6] (maintain uniqueness while shortening 2 chars)
        // Example: '.xeg_a1b2c3d' (8 chars) → '.xeg_a1b2' (6 chars)
        generateScopedName: flags.isDev ? '[name]__[local]__[hash:base64:5]' : '[hash:base64:6]',
        localsConvention: 'camelCaseOnly',
        hashPrefix: 'xeg',
      },
      postcss: './postcss.config.js',
    },
    build: {
      target: 'baseline-widely-available',
      outDir: 'dist',
      emptyOutDir: flags.isDev, // Clean only for dev builds, add for prod
      cssCodeSplit: false,
      assetsInlineLimit: 0,
      sourcemap: flags.sourcemap,
      minify: flags.isProd ? 'terser' : false,
      reportCompressedSize: false, // Phase 406: Improve build log (disable terser reporting)
      // Phase 230: Machine optimization - parallel processing settings
      chunkSizeWarningLimit: 1000, // Increase bundle size warning threshold
      rollupOptions: {
        input: 'src/main.ts',
        output: {
          format: 'iife',
          name: 'XEG',
          inlineDynamicImports: true, // Ensure single iife bundle (Userscript requirement) - also essential in Phase 326
          // Allow sourcesContent in sourcemap generation to ensure source traceability
          sourcemapExcludeSources: false,
          // Actual final filename/format determined by userscriptPlugin
          // Phase 326: Code Splitting is a dynamic import strategy for bundle optimization,
          // but IIFE constraints in Userscript environment prevent code-splitting.
          // All chunks bundled into single file. Therefore manualChunks not applied (IIFE + code-splitting incompatible)
        },
        treeshake: flags.isProd,
        // Phase 230: Parallel processing optimization
        maxParallelFileOps: 10, // Utilize 12 cores
      },
      ...(flags.isProd && {
        terserOptions: {
          compress: {
            drop_console: true,
            drop_debugger: true,
            pure_funcs: ['console.info', 'console.debug', 'exposeDebugAPI'],
            // Phase 308: Bundle size optimization - additional options
            // passes: 4 → 5 (one more optimization pass, saves additional 1-2 KB)
            // unsafe_methods: true (clean up function calls, safety verified)
            passes: 5,
            pure_getters: true,
            unsafe: true,
            unsafe_methods: true, // Phase 308: Additional
            toplevel: true,
          },
          format: { comments: false },
          mangle: { toplevel: true },
          // Phase 230: Enable parallel compression
          maxWorkers: 8, // Use 8 of 12 cores
        },
      }),
    },
    optimizeDeps: {
      include: ['solid-js', 'solid-js/web', 'solid-js/store'],
      exclude: ['test', 'test/**'],
      force: flags.isDev,
    },
    // Phase 406: Development environment optimization
    server: {
      port: 3000,
      middlewareMode: false, // Userscript doesn't need real-time server
      hmr: flags.isDev
        ? {
            protocol: 'ws',
            host: 'localhost',
            port: 5173,
          }
        : false,
    },
    logLevel: flags.isDev ? 'info' : 'warn',
    clearScreen: false,
    // Vite 8.0 compatibility - enable deprecation warnings (Phase 368+)
    future: 'warn',
  };
  const localOverrides = (await loadLocalConfigSafe<Partial<UserConfig>>()) ?? null;

  return localOverrides ? mergeConfig(config, localOverrides) : config;
});

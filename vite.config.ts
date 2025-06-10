/**
 * Vite Configuration for X.com Enhanced Gallery (UserScript Build)
 *
 * 유저스크립트 형식으로 빌드하기 위한 완전한 설정
 */

import preact from '@preact/preset-vite';
import * as fs from 'fs';
import * as path from 'path';
import { defineConfig, Plugin } from 'vite';

// Package information
const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));

// Build mode configuration for optimal performance
interface BuildMode {
  readonly isDevelopment: boolean;
  readonly isProduction: boolean;
  readonly minify: boolean;
  readonly sourcemap: boolean;
  readonly dropConsole: boolean;
}

function getBuildMode(mode?: string): BuildMode {
  const actualMode = mode || 'production';
  const isDevelopment = actualMode === 'development';
  const isProduction = actualMode === 'production';

  return {
    isDevelopment,
    isProduction,
    minify: isProduction,
    sourcemap: isDevelopment,
    dropConsole: isProduction,
  };
}

// Generate optimized userscript header
function generateUserscriptHeader(buildMode: BuildMode): string {
  const devSuffix = buildMode.isDevelopment ? ' (Dev)' : '';
  const version = buildMode.isDevelopment
    ? `${packageJson.version}-dev.${Date.now()}`
    : packageJson.version;

  return `// ==UserScript==
// @name         X.com Enhanced Gallery${devSuffix}
// @namespace    https://github.com/piesp/xcom-enhanced-gallery
// @version      ${version}
// @description  ${packageJson.description}
// @author       PiesP
// @match        https://x.com/*
// @match        https://*.x.com/*
// @grant        GM_registerMenuCommand
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_download
// @grant        GM_openInTab
// @grant        GM_notification
// @connect      pbs.twimg.com
// @connect      video.twimg.com
// @run-at       document-idle
// @supportURL   https://github.com/piesp/xcom-enhanced-gallery/issues
// @downloadURL  https://github.com/piesp/xcom-enhanced-gallery/releases/latest/download/xcom-enhanced-gallery.user.js
// @updateURL    https://github.com/piesp/xcom-enhanced-gallery/releases/latest/download/xcom-enhanced-gallery.user.js
// @noframes
// ==/UserScript==
`;
}

// Enhanced CSS inlining plugin for userscript
function createUserscriptBundlerPlugin(buildMode: BuildMode): Plugin {
  return {
    name: 'userscript-bundler',
    apply: 'build',

    async writeBundle(options: unknown, bundle: unknown) {
      try {
        const bundleObj = bundle as Record<string, { type: string; fileName: string }>;
        const outDir = (options as { dir?: string })?.dir || 'dist';

        // CSS 파일 찾기
        const cssFiles = Object.keys(bundleObj).filter(fileName => fileName.endsWith('.css'));
        const jsFiles = Object.keys(bundleObj).filter(fileName => fileName.endsWith('.js'));

        if (jsFiles.length === 0) {
          console.warn('No JS files found');
          return;
        }

        const mainJsFile = jsFiles[0]!;
        const jsFilePath = path.resolve(outDir, mainJsFile);

        // CSS 내용 수집 및 최적화
        let allCss = '';
        for (const cssFile of cssFiles) {
          const cssFilePath = path.resolve(outDir, cssFile);
          try {
            if (fs.existsSync(cssFilePath)) {
              const cssContent = fs.readFileSync(cssFilePath, 'utf8');

              // CSS 최적화
              const optimizedCss = cssContent
                .replace(/\/\*[\s\S]*?\*\//g, '') // 주석 제거
                .replace(/\s+/g, ' ') // 공백 정규화
                .replace(/;\s*}/g, '}') // 불필요한 세미콜론 제거
                .replace(/:\s+/g, ':') // 콜론 뒤 공백 제거
                .replace(/,\s+/g, ',') // 콤마 뒤 공백 제거
                .replace(/}\s+/g, '}') // 중괄호 뒤 공백 제거
                .replace(/\s+{/g, '{') // 중괄호 앞 공백 제거
                .trim();

              allCss += optimizedCss;
              fs.unlinkSync(cssFilePath);
              console.log(`Processed and removed CSS file: ${cssFile}`);
            }
          } catch (error) {
            console.warn(`Error processing CSS file ${cssFile}:`, error);
          }
        }

        if (!fs.existsSync(jsFilePath)) {
          console.warn(`JS file not found: ${jsFilePath}`);
          return;
        }

        const jsContent = fs.readFileSync(jsFilePath, 'utf8');

        // CSS 주입 코드 생성
        const cssLength = allCss.length;
        const cssInjectionCode =
          cssLength > 0
            ? `
(function() {
  if (typeof document === 'undefined') { return; }
  const existingStyle = document.getElementById('xeg-styles');
  if (existingStyle) { existingStyle.remove(); }
  const style = document.createElement('style');
  style.id = 'xeg-styles';
  style.textContent = ${JSON.stringify(allCss)};
  (document.head || document.documentElement).appendChild(style);
  console.log('[XEG] CSS injected: ' + ${cssLength} + ' chars');
})();`
            : '';

        // 최종 유저스크립트 생성
        const wrappedCode = `${generateUserscriptHeader(buildMode)}
(function() {
  'use strict';
  ${buildMode.isDevelopment ? 'console.log("[XEG] Enhanced Gallery v' + packageJson.version + ' (Dev) - Starting...");' : ''}
  ${cssInjectionCode}
  try {
    ${jsContent}
  } catch (error) {
    console.error('[XEG] Initialization failed:', error);
  }
})();`;

        const outputFileName = buildMode.isDevelopment
          ? 'xcom-enhanced-gallery.dev.user.js'
          : 'xcom-enhanced-gallery.user.js';

        const outputFilePath = path.resolve(outDir, outputFileName);
        fs.writeFileSync(outputFilePath, wrappedCode, 'utf8');

        if (mainJsFile !== outputFileName) {
          fs.unlinkSync(jsFilePath);
        }

        console.log(`CSS inlined: ${allCss.length} characters`);
        console.log(`Generated: ${outputFileName}`);
      } catch (error) {
        console.error('Error in writeBundle:', error);
      }
    },
  };
}

export default defineConfig(({ mode }) => {
  const buildMode = getBuildMode(mode);

  return {
    // 플러그인 구성
    plugins: [
      preact({
        devToolsEnabled: buildMode.isDevelopment,
        prefreshEnabled: buildMode.isDevelopment,
      }),
      createUserscriptBundlerPlugin(buildMode),
    ],

    // 환경 변수 정의
    define: {
      'process.env.NODE_ENV': JSON.stringify(buildMode.isProduction ? 'production' : 'development'),
      'process.env': '{}',
      global: 'globalThis',
      __DEV__: buildMode.isDevelopment,
      __PROD__: buildMode.isProduction,
      __VERSION__: JSON.stringify(packageJson.version),
    },

    // CSS 최적화
    css: {
      modules: {
        localsConvention: 'camelCaseOnly',
        generateScopedName: buildMode.isDevelopment ? '[local]_[hash:base64:3]' : '[hash:base64:5]',
      },
      devSourcemap: false,
    },

    build: {
      target: 'es2020',
      outDir: 'dist',
      emptyOutDir: true,
      cssCodeSplit: false,
      assetsInlineLimit: 0,
      reportCompressedSize: !buildMode.isDevelopment,

      rollupOptions: {
        input: 'src/main.ts',
        external: [],

        output: {
          entryFileNames: buildMode.isDevelopment
            ? 'xcom-enhanced-gallery.dev.user.js'
            : 'xcom-enhanced-gallery.user.js',
          assetFileNames: '[name][extname]',
          format: 'iife',
          name: 'XEG',
          inlineDynamicImports: true,
          manualChunks: undefined,
        },

        treeshake: {
          moduleSideEffects: false,
          propertyReadSideEffects: false,
          tryCatchDeoptimization: false,
          unknownGlobalSideEffects: false,
        },
      },

      // 최적화된 minification 설정
      minify: buildMode.minify ? 'terser' : false,
      terserOptions: buildMode.isProduction
        ? {
            compress: {
              drop_console: buildMode.dropConsole,
              drop_debugger: true,
              passes: 3,
              pure_funcs: ['console.log', 'console.warn', 'console.info', 'console.debug'],
              pure_getters: true,
              unsafe: true,
              unsafe_comps: true,
              unsafe_math: true,
              unused: true,
              dead_code: true,
              side_effects: false,
              collapse_vars: true,
              reduce_vars: true,
              arrows: true,
              booleans: true,
              evaluate: true,
              loops: true,
              module: true,
              toplevel: true,
            },
            mangle: {
              toplevel: true,
              module: true,
              keep_fnames: false,
              keep_classnames: false,
              reserved: [
                // Tampermonkey/Greasemonkey API
                'GM_setValue',
                'GM_getValue',
                'GM_deleteValue',
                'GM_download',
                'GM_openInTab',
                'GM_notification',
                'GM_registerMenuCommand',
                // 필수 브라우저 API
                'document',
                'window',
                'console',
                'navigator',
                'location',
                'setTimeout',
                'setInterval',
                'clearTimeout',
                'clearInterval',
                'fetch',
                'XMLHttpRequest',
                'Promise',
                'JSON',
                'Math',
                'Date',
                // Preact 필수
                'preact',
                'render',
                'Component',
                'Fragment',
                'h',
                'createElement',
                'useState',
                'useEffect',
                'useRef',
                'useMemo',
                'useCallback',
              ],
            },
            format: {
              comments: false,
              ascii_only: true,
              semicolons: false,
              beautify: false,
              quote_style: 1,
            },
          }
        : undefined,

      sourcemap: buildMode.sourcemap,
      chunkSizeWarningLimit: 2000,
    },

    // 경로 해결
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '@app': path.resolve(__dirname, 'src/app'),
        '@features': path.resolve(__dirname, 'src/features'),
        '@shared': path.resolve(__dirname, 'src/shared'),
        '@core': path.resolve(__dirname, 'src/core'),
        '@infrastructure': path.resolve(__dirname, 'src/infrastructure'),
        '@utils': path.resolve(__dirname, 'src/utils'),
        '@assets': path.resolve(__dirname, 'src/assets'),
      },
    },

    // 의존성 최적화
    optimizeDeps: {
      include: ['preact', 'preact/hooks', '@preact/signals'],
      force: buildMode.isDevelopment,
    },

    // 개발 서버
    server: {
      port: 3000,
      open: false,
      cors: true,
      hmr: buildMode.isDevelopment,
    },

    // ESBuild 설정 - rolldown-vite 호환성을 위해 비활성화
    esbuild: false,

    // 로깅
    logLevel: buildMode.isDevelopment ? 'info' : 'warn',
    clearScreen: false,
  };
});

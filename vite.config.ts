/**
 * Vite Configuration for X.com Enhanced Gallery (UserScript Build)
 *
 * 유저스크립트 형식으로 빌드하기 위한 완전한 설정
 */
/* eslint-env node */

import preact from '@preact/preset-vite';
import * as fs from 'fs';
import * as path from 'path';
import process from 'process';
import console from 'console';
import { defineConfig } from 'vite';
const FEATURE_BODY_SCROLL_LOCK =
  process.env.FEATURE_BODY_SCROLL_LOCK === 'false' ? 'false' : 'true';
// Critical CSS 집계 & 중복 제거 (surface glass 토큰 단일 선언 보장)
import { aggregateCriticalCssSync, sanitizeCssWithCriticalRoot } from './src/build/critical-css';
// 개선된 빌드 진행상황 플러그인
import {
  buildProgressPlugin,
  memoryUsagePlugin,
  modulePreloadAnalyticsPlugin,
} from './src/build/build-progress-plugin';

// Package information
const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));

// Build mode configuration - optimized
/**
 * @typedef {Object} BuildMode
 * @property {boolean} isDevelopment
 * @property {boolean} isProduction
 * @property {boolean} minify
 * @property {boolean} sourcemap
 * @property {boolean} dropConsole
 */

/**
 * @param {string} mode
 * @returns {BuildMode}
 */
function getBuildMode(mode) {
  const isDevelopment = mode === 'development';

  return {
    isDevelopment,
    isProduction: !isDevelopment,
    minify: !isDevelopment,
    sourcemap: true, // 항상 소스맵 생성
    dropConsole: !isDevelopment,
  };
}

// Generate userscript header
/**
 * @param {BuildMode} buildMode
 * @returns {string}
 */
function generateUserscriptHeader(buildMode) {
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
// @license      MIT
// @match        https://*.x.com/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_download
// @grant        GM_xmlhttpRequest
// @connect      pbs.twimg.com
// @connect      video.twimg.com
// @run-at       document-idle
// @supportURL   https://github.com/piesp/xcom-enhanced-gallery/issues
// @downloadURL  https://github.com/piesp/xcom-enhanced-gallery/releases/latest/download/xcom-enhanced-gallery.user.js
// @updateURL    https://github.com/piesp/xcom-enhanced-gallery/releases/latest/download/xcom-enhanced-gallery.user.js
// @noframes
// ==/UserScript==

/*
 * X.com Enhanced Gallery
 *
 * This userscript includes the following third-party libraries:
 * - Preact (MIT License) - https://github.com/preactjs/preact
 * - @preact/signals (MIT License) - https://github.com/preactjs/signals
 * - fflate (MIT License) - https://github.com/101arrowz/fflate
 * - Tabler Icons (MIT License) - https://github.com/tabler/tabler-icons
 *
 * All libraries are used under their respective MIT licenses.
 * Full license texts are available at:
 * https://github.com/piesp/xcom-enhanced-gallery/tree/main/LICENSES
 */
`;
}

// 유저스크립트 번들링 플러그인
/**
 * @param {BuildMode} buildMode
 * @returns {import('vite').Plugin}
 */
function createUserscriptBundlerPlugin(buildMode) {
  return {
    name: 'userscript-bundler',
    apply(config, env) {
      return env.command === 'build';
    },

    async writeBundle(options, bundle) {
      try {
        const bundleObj = bundle; // rollup bundle object
        const outDir = options && 'dir' in options && options.dir ? options.dir : 'dist';

        // 소스맵 파일이 생성될 때까지 잠시 대기
        await new Promise(resolve => globalThis.setTimeout(resolve, 100));

        // CSS와 JS 파일 찾기
        const cssFiles = Object.keys(bundleObj).filter(fileName => fileName.endsWith('.css'));
        const jsFiles = Object.keys(bundleObj).filter(fileName => fileName.endsWith('.js'));

        if (jsFiles.length === 0) {
          console.warn('JS 파일을 찾을 수 없습니다.');
          return;
        }

        // 소스맵 파일 확인 (파일시스템에서)
        const checkForSourceMaps = () => {
          return jsFiles
            .map(jsFile => {
              const mapPath = path.resolve(outDir, `${jsFile}.map`);
              return fs.existsSync(mapPath) ? `${jsFile}.map` : null;
            })
            .filter(Boolean);
        };

        const mapFiles = checkForSourceMaps();

        // 엔트리 파일 찾기 (isEntry 속성 우선, fallback으로 첫 번째 파일)
        const entryFile = Object.entries(bundleObj).find(
          ([, info]) =>
            info &&
            typeof info === 'object' &&
            'type' in info &&
            info.type === 'chunk' &&
            'isEntry' in info &&
            info.isEntry
        );
        const mainJsFile = entryFile ? entryFile[0] : jsFiles[0];

        if (!mainJsFile) {
          console.warn('메인 JS 파일을 찾을 수 없습니다.');
          return;
        }

        const jsFilePath = path.resolve(outDir, mainJsFile);

        // CSS 내용 수집
        let allCss = '';
        for (const cssFile of cssFiles) {
          const cssFilePath = path.resolve(outDir, cssFile);
          if (fs.existsSync(cssFilePath)) {
            const cssContent = fs.readFileSync(cssFilePath, 'utf8');
            // 기본적인 CSS 최적화
            const processedCss = cssContent
              .replace(/\/\*[\s\S]*?\*\//g, '') // 주석 제거
              .replace(/\s+/g, ' ') // 공백 정규화
              .trim();

            allCss += processedCss;
            fs.unlinkSync(cssFilePath);
          }
        }

        if (!fs.existsSync(jsFilePath)) {
          console.warn(`JS 파일을 찾을 수 없습니다: ${jsFilePath}`);
          return;
        }

        const jsContent = fs.readFileSync(jsFilePath, 'utf8');

        // Critical CSS 변수(:root) 집계 및 중복 제거
        let finalCss = allCss;
        try {
          if (finalCss.length > 0) {
            const criticalRoot = aggregateCriticalCssSync(); // :root{...}
            if (criticalRoot && criticalRoot.startsWith(':root')) {
              // 집계된 :root 블록을 선두에 두고 중복 변수 선언 제거
              const combined = `${criticalRoot}${finalCss}`;
              finalCss = sanitizeCssWithCriticalRoot(combined);
            }
          }
        } catch (e) {
          console.warn('[userscript-bundler] Critical CSS 집계 실패 – fallback 사용:', e);
        }

        // CSS 주입 코드 생성 (finalCss 사용)
        const cssInjectionCode =
          finalCss.length > 0
            ? `
(function() {
  if (typeof document === 'undefined') return;
  const existingStyle = document.getElementById('xeg-styles');
  if (existingStyle) existingStyle.remove();
  const style = document.createElement('style');
  style.id = 'xeg-styles';
  style.textContent = ${JSON.stringify(finalCss)};
  (document.head || document.documentElement).appendChild(style);
})();`
            : '';

        // 최종 유저스크립트 생성
        const wrappedCode = `${generateUserscriptHeader(buildMode)}
(function() {
  'use strict';
  ${cssInjectionCode}
  try {
    ${jsContent}
  } catch (error) {
    console.error('[XEG] 초기화 실패:', error);
  }
})();`;

        const outputFileName = buildMode.isDevelopment
          ? 'xcom-enhanced-gallery.dev.user.js'
          : 'xcom-enhanced-gallery.user.js';

        const outputFilePath = path.resolve(outDir, outputFileName);
        fs.writeFileSync(outputFilePath, wrappedCode, 'utf8');

        // 소스맵 파일 처리 (개발환경에서만)
        if (buildMode.isDevelopment && mapFiles.length > 0) {
          const mainMapFile = mapFiles.find(f => f === `${mainJsFile}.map`) || mapFiles[0];
          if (mainMapFile) {
            const sourceMapPath = path.resolve(outDir, mainMapFile);
            const targetMapPath = path.resolve(outDir, `${outputFileName}.map`);

            if (fs.existsSync(sourceMapPath)) {
              // 소스맵 파일을 올바른 이름으로 복사
              fs.copyFileSync(sourceMapPath, targetMapPath);

              // 유저스크립트에 소스맵 참조 추가
              const wrappedCodeWithMap =
                wrappedCode + `\n//# sourceMappingURL=${outputFileName}.map`;
              fs.writeFileSync(outputFilePath, wrappedCodeWithMap, 'utf8');

              console.log(
                `✅ ${outputFileName} 생성 완료 (CSS: ${allCss.length}자, 소스맵: ${targetMapPath})`
              );
              return; // 성공 메시지 중복 방지
            }
          }
        }

        // 원본 JS 파일 제거
        if (mainJsFile !== outputFileName) {
          fs.unlinkSync(jsFilePath);
        }

        console.log(`✅ ${outputFileName} 생성 완료 (CSS: ${allCss.length}자)`);
      } catch (error) {
        console.error('번들링 오류:', error);
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
      buildProgressPlugin(),
      createUserscriptBundlerPlugin(buildMode),
      memoryUsagePlugin(),
      modulePreloadAnalyticsPlugin(),
    ],

    // 환경 변수 정의
    define: {
      'process.env.NODE_ENV': JSON.stringify(buildMode.isProduction ? 'production' : 'development'),
      global: 'globalThis',
      __DEV__: buildMode.isDevelopment,
      __PROD__: buildMode.isProduction,
      __VERSION__: JSON.stringify(packageJson.version),
      'process.env.FEATURE_BODY_SCROLL_LOCK': JSON.stringify(FEATURE_BODY_SCROLL_LOCK),
    },

    // CSS 최적화
    css: {
      modules: {
        // CSS Modules 설정 강화
        generateScopedName: buildMode.isDevelopment
          ? '[name]__[local]__[hash:base64:5]'
          : '[hash:base64:8]',
        localsConvention: 'camelCaseOnly',
        hashPrefix: 'xeg',
      },
      preprocessorOptions: {
        scss: {
          additionalData: `@import "@shared/styles/design-tokens.css";`,
        },
      },
      // PostCSS 설정
      postcss: './postcss.config.js',
    },

    build: {
      target: 'es2020',
      outDir: buildMode.isDevelopment ? 'dist/dev' : 'dist/prod',
      emptyOutDir: false, // 개발/프로덕션 빌드가 서로 지우지 않도록
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
          name: 'XG',
          inlineDynamicImports: true,
          // 개발 환경에서도 기본적인 최적화 적용
          ...(buildMode.isDevelopment && {
            manualChunks: undefined,
            compact: true,
          }),
        },
        treeshake: {
          preset: 'smallest', // 더 적극적인 tree-shaking
          moduleSideEffects: false,
          unknownGlobalSideEffects: false,
          // 개발 환경에서도 더 적극적인 tree-shaking
          propertyReadSideEffects: false,
          tryCatchDeoptimization: false,
          annotations: true,
        },
        // 번들 분석을 위한 onwarn 핸들러
        onwarn(warning, warn) {
          // 순환 의존성 경고 억제 (vendor 라이브러리에서 발생)
          if (warning.code === 'CIRCULAR_DEPENDENCY') {
            return;
          }
          // 사용되지 않는 import 경고 표시
          if (warning.code === 'UNUSED_EXTERNAL_IMPORT') {
            console.warn(`Unused import: ${warning.message}`);
          }
          warn(warning);
        },
      },

      // 개발 환경에서는 압축을 끄고, 프로덕션에서만 terser를 사용
      minify: buildMode.isProduction ? 'terser' : false,
      ...(buildMode.isProduction && {
        terserOptions: {
          compress: {
            drop_console: buildMode.dropConsole,
            drop_debugger: true,
            passes: 3, // 압축 패스 증가
            pure_funcs: buildMode.dropConsole
              ? ['console.log', 'console.debug', 'console.info', 'console.warn']
              : [],
            dead_code: true,
            unused: true,
            collapse_vars: true,
            reduce_vars: true,
            unsafe_regexp: false,
            unsafe_undefined: false,
            // 추가 최적화
            join_vars: true,
            sequences: true,
            properties: true,
            conditionals: true,
            if_return: true,
            evaluate: true,
            booleans: true,
            loops: true,
            hoist_funs: true,
            hoist_vars: false,
          },
          mangle: {
            toplevel: true,
            reserved: [
              // UserScript/Browser APIs
              'GM_setValue',
              'GM_getValue',
              'GM_download',
              'GM_openInTab',
              'GM_notification',
              'GM_registerMenuCommand',
              'GM_xmlhttpRequest',
              // 필수 전역 객체
              'document',
              'window',
              'console',
              'navigator',
              'fetch',
              // Preact 핵심
              'preact',
              'render',
              'h',
              'Fragment',
              // 글로벌 스코프
              'globalThis',
              'self',
            ],
          },
          format: {
            comments: false,
            ascii_only: true,
          },
        },
      }),

      sourcemap: buildMode.isDevelopment ? true : false, // 개발환경에선 별도 파일, 프로덕션에선 비활성화
      chunkSizeWarningLimit: 2000,
    },

    // 경로 해결
    resolve: {
      alias: {
        '@': path.resolve(process.cwd(), 'src'),
        '@/components': path.resolve(process.cwd(), 'src/components'),
        '@/utils': path.resolve(process.cwd(), 'src/utils'),
        '@/types': path.resolve(process.cwd(), 'src/types'),
        '@/external': path.resolve(process.cwd(), 'src/external'),
        '@/assets': path.resolve(process.cwd(), 'src/assets'),
        // Clean Architecture 기반 alias들
        '@features': path.resolve(process.cwd(), 'src/features'),
        '@shared': path.resolve(process.cwd(), 'src/shared'),
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

    // 로깅
    logLevel: buildMode.isDevelopment ? 'info' : 'warn',
    clearScreen: false,
  };
});

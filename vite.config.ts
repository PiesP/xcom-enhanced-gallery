/**
 * Vite Configuration for X.com Enhanced Gallery (UserScript Build)
 *
 * 유저스크립트 형식으로 빌드하기 위한 완전한 설정
 */

import preact from '@preact/preset-vite';
import * as fs from 'fs';
import * as path from 'path';
import { defineConfig, Plugin } from 'vite';

// 번들 분석 플러그인
function createBundleAnalysisPlugin(): Plugin {
  return {
    name: 'bundle-analysis',
    apply: 'build',
    writeBundle(options, bundle) {
      const bundleObj = bundle as Record<string, any>;
      let totalSize = 0;
      const chunks: Array<{ name: string; size: number }> = [];

      for (const [fileName, fileInfo] of Object.entries(bundleObj)) {
        if (fileInfo.type === 'chunk' && fileInfo.code) {
          const size = Buffer.byteLength(fileInfo.code, 'utf8');
          totalSize += size;
          chunks.push({ name: fileName, size });
        }
      }

      // 간단한 분석 보고서
      const analysis = {
        timestamp: new Date().toISOString(),
        totalSize,
        chunks,
        isWithinBudget: totalSize <= 500 * 1024, // 500KB 제한
      };

      const outDir = (options as { dir?: string })?.dir || 'dist';
      fs.writeFileSync(
        path.resolve(outDir, 'bundle-analysis.json'),
        JSON.stringify(analysis, null, 2)
      );

      console.log(`\n📊 번들 크기: ${(totalSize / 1024).toFixed(2)} KB`);
      if (totalSize > 500 * 1024) {
        console.warn('⚠️  번들 크기가 500KB를 초과했습니다.');
      }
    },
  };
}

// Package information
const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));

// Build mode configuration - optimized
interface BuildMode {
  readonly isDevelopment: boolean;
  readonly isProduction: boolean;
  readonly minify: boolean;
  readonly sourcemap: boolean;
  readonly dropConsole: boolean;
}

function getBuildMode(mode?: string): BuildMode {
  const isDevelopment = mode === 'development';

  return {
    isDevelopment,
    isProduction: !isDevelopment,
    minify: !isDevelopment,
    sourcemap: isDevelopment,
    dropConsole: !isDevelopment,
  };
}

// Generate userscript header
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
// @license      MIT
// @match        https://x.com/*
// @match        https://*.x.com/*
// @grant        GM_registerMenuCommand
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_download
// @grant        GM_openInTab
// @grant        GM_notification
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
 * - motion (MIT License) - https://github.com/motiondivision/motion
 * - @tanstack/query-core (MIT License) - https://github.com/TanStack/query
 * - @tanstack/react-virtual (MIT License) - https://github.com/TanStack/virtual
 *
 * All libraries are used under their respective MIT licenses.
 * Full license texts are available at:
 * https://github.com/piesp/xcom-enhanced-gallery/tree/main/LICENSES
 */
`;
}

// 유저스크립트 번들링 플러그인
function createUserscriptBundlerPlugin(buildMode: BuildMode): Plugin {
  return {
    name: 'userscript-bundler',
    apply: 'build',

    async writeBundle(options: unknown, bundle: unknown) {
      try {
        const bundleObj = bundle as Record<string, { type: string; fileName: string }>;
        const outDir = (options as { dir?: string })?.dir || 'dist';

        // CSS와 JS 파일 찾기
        const cssFiles = Object.keys(bundleObj).filter(fileName => fileName.endsWith('.css'));
        const jsFiles = Object.keys(bundleObj).filter(fileName => fileName.endsWith('.js'));

        if (jsFiles.length === 0) {
          console.warn('JS 파일을 찾을 수 없습니다.');
          return;
        }

        const mainJsFile = jsFiles[0]!;
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

        // CSS 주입 코드 생성
        const cssInjectionCode =
          allCss.length > 0
            ? `
(function() {
  if (typeof document === 'undefined') return;
  const existingStyle = document.getElementById('xeg-styles');
  if (existingStyle) existingStyle.remove();
  const style = document.createElement('style');
  style.id = 'xeg-styles';
  style.textContent = ${JSON.stringify(allCss)};
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
      createUserscriptBundlerPlugin(buildMode),
      createBundleAnalysisPlugin(),
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
      outDir: 'dist',
      emptyOutDir: false,
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
          manualChunks: undefined as any,
          // Phase 5: 추가적인 최적화 설정
        },
        treeshake: {
          moduleSideEffects: false,
          unknownGlobalSideEffects: false,
          // Phase 5: 더 적극적인 tree-shaking
          propertyReadSideEffects: false,
          tryCatchDeoptimization: false,
          annotations: true,
        },
        // Phase 5: 번들 분석을 위한 onwarn 핸들러
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

      // 최적화된 minification 설정
      minify: buildMode.minify ? 'terser' : false,
      ...(buildMode.isProduction && {
        terserOptions: {
          compress: {
            drop_console: buildMode.dropConsole,
            drop_debugger: true,
            passes: 2,
            pure_funcs: buildMode.dropConsole ? ['console.log', 'console.debug'] : [],
            dead_code: true,
            unused: true,
            collapse_vars: true,
            reduce_vars: true,
            unsafe_regexp: false,
            unsafe_undefined: false,
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

      sourcemap: buildMode.sourcemap,
      chunkSizeWarningLimit: 2000,
    },

    // 경로 해결
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '@/components': path.resolve(__dirname, 'src/components'),
        '@/utils': path.resolve(__dirname, 'src/shared/utils'),
        '@/types': path.resolve(__dirname, 'src/types'),
        '@/external': path.resolve(__dirname, 'src/external'),
        '@/assets': path.resolve(__dirname, 'src/assets'),
        // 기존 alias들도 호환성을 위해 유지
        '@core': path.resolve(__dirname, 'src/core'),
        '@features': path.resolve(__dirname, 'src/features'),
        '@shared': path.resolve(__dirname, 'src/shared'),
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

    // 로깅
    logLevel: buildMode.isDevelopment ? 'info' : 'warn',
    clearScreen: false,
  };
});

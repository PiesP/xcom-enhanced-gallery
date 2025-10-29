/**
 * Vite 설정 파일 — 단일 userscript 번들 생성. dev/prod 공통으로 소스맵 생성(디버그/검증용).
 * - Dev 빌드: 사람이 읽기 쉬운 버전 태그(타임스탬프) + 비압축(디버깅 편의).
 * - Prod 빌드: terser 압축(콘솔/디버거 제거), 라이선스 노티스 주입, 번들 크기 최적화.
 * - 결과물: 최종 userscript 파일(및 sourcemap)을 dist/에 기록하고 임시/자산 파일 정리.
 */
import { defineConfig, Plugin, UserConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import solidPlugin from 'vite-plugin-solid';
import { visualizer } from 'rollup-plugin-visualizer';
import fs from 'node:fs';
import path from 'node:path';
import type { OutputBundle, OutputChunk, OutputAsset, NormalizedOutputOptions } from 'rollup';
import { transformSync } from '@babel/core';

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
  // 정책: 개발 빌드만 소스맵을 생성하여 디버깅 지원. 프로덕션은 파일 크기 최소화 우선.
  return { mode, isDev, isProd: !isDev, sourcemap: isDev };
}

const pkg: PackageJsonMeta = JSON.parse(fs.readFileSync('./package.json', 'utf8'));

/**
 * 외부 라이브러리 라이선스 텍스트를 LICENSES/에서 읽어 userscript 상단에 주석으로 삽입.
 * 없거나 읽기 실패 시 경고를 남기고 진행(빌드 중단하지 않음).
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
      console.warn(`[license] ${name} 라이선스 파일 읽기 실패:`, error);
    }
  }

  notices += ' */\n';
  return notices;
}

function userscriptHeader(flags: BuildFlags): string {
  // 개발용 버전 태그: YYYY.MMDD.HHmmss.SSS (빌드 식별 편의)
  // production에서는 package.json의 버전 사용.
  // userscript 메타 필드(권한, match, update/download URL 등)를 포함.
  // 개발 빌드용 사람이 읽기 쉬운 버전 형식: YYYY.MMDD.HHmmss.SSS
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
    `// @grant        GM_xmlhttpRequest\n` +
    `// @connect      pbs.twimg.com\n` +
    `// @connect      video.twimg.com\n` +
    `// @run-at       document-idle\n` +
    `// @supportURL   https://github.com/piesp/xcom-enhanced-gallery/issues\n` +
    `// @downloadURL  https://github.com/piesp/xcom-enhanced-gallery/releases/latest/download/xcom-enhanced-gallery.user.js\n` +
    `// @updateURL    https://github.com/piesp/xcom-enhanced-gallery/releases/latest/download/xcom-enhanced-gallery.user.js\n` +
    `// @noframes\n` +
    `// ==/UserScript==\n`
  );
}

/**
 * 빌드 타임에 CSS를 DOM에 주입하는 안전한 코드 생성
 *
 * @param css - 빌드 시점에 Vite가 생성한 CSS 문자열 (신뢰할 수 있는 입력)
 * @returns 스타일 인젝션 JavaScript 코드
 *
 * @security 이 함수는 빌드 타임에만 실행되며, 런타임 사용자 입력을 받지 않습니다.
 *           CSS는 JSON.stringify()로 이스케이프되어 안전하게 삽입됩니다.
 */
function createStyleInjector(css: string): string {
  if (!css.trim()) {
    return '';
  }

  // CSS를 JSON.stringify로 안전하게 이스케이프
  const escapedCss = JSON.stringify(css);

  // IIFE로 감싸진 스타일 인젝션 코드 생성
  return (
    `(function(){` +
    `try{` +
    `var s=document.getElementById('xeg-styles');` +
    `if(s) s.remove();` +
    `s=document.createElement('style');` +
    `s.id='xeg-styles';` +
    `s.textContent=${escapedCss};` +
    `(document.head||document.documentElement).appendChild(s);` +
    `}catch(e){console.error('[XEG] style inject fail',e);}` +
    `})();\n`
  );
}

/**
 * 빌드 타임에 UserScript 래퍼 코드 생성
 *
 * @param options - 래퍼 생성 옵션
 * @param options.header - UserScript 메타 블록
 * @param options.license - 라이선스 텍스트 (선택적)
 * @param options.styleInjector - 스타일 인젝션 코드
 * @param options.code - 번들된 애플리케이션 코드
 * @param options.isProd - 프로덕션 빌드 여부
 * @returns 완전한 UserScript 코드
 *
 * @security 이 함수는 빌드 타임에만 실행되며, 모든 입력은 빌드 프로세스에서
 *           생성된 신뢰할 수 있는 문자열입니다. 런타임 사용자 입력을 포함하지 않습니다.
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
    // 프로덕션: 최소화된 형태
    return `${header}${license}(function(){'use strict';${styleInjector}${code}})();`;
  } else {
    // 개발: 가독성을 위한 개행 포함
    return `${header}${license}(function(){\n'use strict';\n${styleInjector}${code}\n})();`;
  }
}

function userscriptPlugin(flags: BuildFlags): Plugin {
  return {
    name: 'xeg-userscript-wrapper',
    apply: 'build',
    writeBundle(options: NormalizedOutputOptions, bundle: OutputBundle) {
      // outDir 결정 및 번들 항목 집계 (CSS, entry chunk, sourcemap)
      const outDir = options.dir ?? 'dist';
      let cssConcat = '';
      let entryChunk: OutputChunk | undefined;
      let sourcemapContent = '';

      // 모든 번들 항목을 처리
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

      // 스타일 인젝션 코드 생성 (빌드 타임)
      const styleInjector = createStyleInjector(cssConcat);

      // 엔트리 코드 내에 남아 있을 수 있는 sourceMappingURL 주석을 제거하여
      // userscript 파일에 중복 주석이 남지 않도록 함.
      const cleanedCode = entryChunk.code
        .replace(/\/\/#\s*sourceMappingURL\s*=.*$/gm, '')
        .replace(/\/\*#\s*sourceMappingURL\s*=.*?\*\//gs, '');

      // production 빌드에 한해 외부 라이선스 텍스트를 상단에 주석으로 삽입.
      const licenseNotices = flags.isProd ? generateLicenseNotices() : '';

      // 전체 userscript 래퍼 생성 (빌드 타임)
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

      // 개발 빌드에서만 sourcemap 파일을 별도 기록(디버깅 목적).
      if (flags.isDev && sourcemapContent) {
        const mapName = 'xcom-enhanced-gallery.dev.user.js.map';
        fs.writeFileSync(path.join(outDir, mapName), sourcemapContent, 'utf8');
        // 파일 끝에 sourceMappingURL 주석 추가 (디버깅 편의)
        try {
          const suffix = `\n//# sourceMappingURL=${mapName}`;
          fs.appendFileSync(path.join(outDir, finalName), suffix, 'utf8');
        } catch {}
        console.log(`✅ Sourcemap 생성: ${mapName}`);
      }

      console.log(`✅ Userscript 생성: ${finalName}`);

      // dist/assets 같은 임시 자산 디렉터리 제거(단일 userscript 산출을 목표).
      const assetsDir = path.join(outDir, 'assets');
      if (fs.existsSync(assetsDir)) {
        fs.rmSync(assetsDir, { recursive: true, force: true });
      }

      // 불필요한 파일들 정리
      const unnecessaryFiles = ['_cleanup_marker'];
      for (const file of unnecessaryFiles) {
        const filePath = path.join(outDir, file);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

      console.log('🗑️ 불필요한 파일들 정리 완료');
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
      // node_modules는 건드리지 않음
      if (id.includes('node_modules')) {
        return null;
      }
      // 타입스크립트/JS 소스만 처리
      if (!/\.(ts|tsx|js|jsx)$/.test(id)) {
        return null;
      }
      // Babel 변환을 통해 형태가 보존되는 범위에서 logger.debug / logger.info 호출을 제거.
      // 목적: 프로덕션 번들 크기 및 노출 로그 최소화. 부작용이 우려되는 복잡한 표현식은
      // undefined 대체로 안전하게 처리.
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
                  // prod 번들 크기 절감을 위해 debug/info 로그 호출 제거
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

export default defineConfig(({ mode }) => {
  const flags = resolveFlags(mode);
  const config: UserConfig = {
    plugins: [
      stripLoggerDebugPlugin(flags),
      solidPlugin({ dev: flags.isDev, ssr: false }),
      tsconfigPaths({ projects: ['tsconfig.json'] }),
      userscriptPlugin(flags),
      // Bundle 분석 (prod 빌드 시에만)
      flags.isProd &&
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
      __PROD__: flags.isProd,
      __VERSION__: JSON.stringify(pkg.version),
      'process.env.NODE_ENV': JSON.stringify(flags.isProd ? 'production' : 'development'),
      'process.env': '{}',
      global: 'globalThis',
    },
    esbuild: {
      jsx: 'preserve',
      jsxImportSource: 'solid-js',
      // Phase 230: esbuild 병렬 처리 최적화
      tsconfigRaw: {
        compilerOptions: {
          useDefineForClassFields: false, // Solid.js 호환성
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
        generateScopedName: flags.isDev ? '[name]__[local]__[hash:base64:5]' : '[hash:base64:8]',
        localsConvention: 'camelCaseOnly',
        hashPrefix: 'xeg',
      },
      postcss: './postcss.config.js',
    },
    build: {
      target: 'es2020',
      outDir: 'dist',
      emptyOutDir: flags.isDev, // dev 빌드 시에만 정리, prod는 추가
      cssCodeSplit: false,
      assetsInlineLimit: 0,
      sourcemap: flags.sourcemap,
      minify: flags.isProd ? 'terser' : false,
      reportCompressedSize: flags.isProd,
      // Phase 230: 머신 최적화 - 병렬 처리 설정
      chunkSizeWarningLimit: 1000, // 번들 크기 경고 임계값 증가
      rollupOptions: {
        input: 'src/main.ts',
        output: {
          format: 'iife',
          name: 'XEG',
          inlineDynamicImports: true, // 단일 iife 번들 보장(Userscript 용)
          // Sourcemap 생성 시 sourcesContent 포함을 허용하여 원본 추적성 보장
          sourcemapExcludeSources: false,
          // 실제 최종 파일명/포맷은 userscriptPlugin에서 결정
        },
        treeshake: flags.isProd,
        // Phase 230: 병렬 처리 최적화
        maxParallelFileOps: 10, // 12 코어 활용
      },
      ...(flags.isProd && {
        terserOptions: {
          compress: {
            drop_console: true,
            drop_debugger: true,
            // additional aggressive options to reduce size
            passes: 4,
            pure_getters: true,
            unsafe: true, // enable additional optimizations (reviewed)
            toplevel: true,
          },
          format: { comments: false },
          mangle: { toplevel: true },
          // Phase 230: 병렬 압축 활성화
          maxWorkers: 8, // 12 코어 중 8개 활용
        },
      }),
    },
    optimizeDeps: {
      include: ['solid-js', 'solid-js/web', 'solid-js/store'],
      exclude: ['test', 'test/**'],
      force: flags.isDev,
    },
    server: { port: 3000, hmr: flags.isDev },
    logLevel: flags.isDev ? 'info' : 'warn',
    clearScreen: false,
  };
  return config;
});

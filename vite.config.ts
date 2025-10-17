/**
 * Vite configuration (TypeScript + strict typing)
 * - Dev: sourcemap + unminified
 * - Prod: terser + drop console
 * - Output: single userscript file
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
  // R5: dev/prod 모두 소스맵 생성 (추적/디버그용). prod는 validate-build에서 무결성 가드.
  return { mode, isDev, isProd: !isDev, sourcemap: true };
}

const pkg: PackageJsonMeta = JSON.parse(fs.readFileSync('./package.json', 'utf8'));

/**
 * 외부 라이브러리 라이선스 정보 생성
 */
function generateLicenseNotices(): string {
  const licenseFiles = [
    { path: './LICENSES/solid-js-MIT.txt', name: 'Solid.js' },
    { path: './LICENSES/heroicons-MIT.txt', name: 'Heroicons' },
  ];

  let notices = '\n/*\n * Third-Party Licenses\n * ====================\n';

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

function userscriptPlugin(flags: BuildFlags): Plugin {
  return {
    name: 'xeg-userscript-wrapper',
    apply: 'build',
    writeBundle(options: NormalizedOutputOptions, bundle: OutputBundle) {
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

      const styleInjector = cssConcat.trim().length
        ? `(function(){try{var s=document.getElementById('xeg-styles');if(s) s.remove();s=document.createElement('style');s.id='xeg-styles';s.textContent=${JSON.stringify(cssConcat)};(document.head||document.documentElement).appendChild(s);}catch(e){console.error('[XEG] style inject fail',e);}})();\n`
        : '';

      // 내부 엔트리 코드에 남아 있을 수 있는 sourceMappingURL 주석 제거
      const cleanedCode = entryChunk.code
        .replace(/\/\/#\s*sourceMappingURL\s*=.*$/gm, '')
        .replace(/\/\*#\s*sourceMappingURL\s*=.*?\*\//gs, '');

      // 라이선스 정보 추가 (프로덕션 빌드에만)
      const licenseNotices = flags.isProd ? generateLicenseNotices() : '';

      const wrapped = `${userscriptHeader(flags)}${licenseNotices}(function(){\n'use strict';\n${styleInjector}${cleanedCode}\n})();`;
      const finalName = flags.isDev
        ? 'xcom-enhanced-gallery.dev.user.js'
        : 'xcom-enhanced-gallery.user.js';

      fs.writeFileSync(path.join(outDir, finalName), wrapped, 'utf8');

      // dev/prod 모두 sourcemap 파일 기록 (R5)
      if (sourcemapContent) {
        const mapName = flags.isDev
          ? 'xcom-enhanced-gallery.dev.user.js.map'
          : 'xcom-enhanced-gallery.user.js.map';
        fs.writeFileSync(path.join(outDir, mapName), sourcemapContent, 'utf8');
        // 파일 끝에 sourceMappingURL 주석 추가 (디버깅 편의)
        try {
          const suffix = `\n//# sourceMappingURL=${mapName}`;
          fs.appendFileSync(path.join(outDir, finalName), suffix, 'utf8');
        } catch {}
        console.log(`✅ Sourcemap 생성: ${mapName}`);
      }

      console.log(`✅ Userscript 생성: ${finalName}`);

      // assets 폴더와 그 내용, 기타 불필요한 파일들을 삭제
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
      if (id.includes('node_modules')) {
        return null;
      }

      if (!/\.(ts|tsx|js|jsx)$/.test(id)) {
        return null;
      }

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
                  t.isIdentifier(callee.property, { name: 'debug' })
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
      rollupOptions: {
        input: 'src/main.ts',
        output: {
          format: 'iife',
          name: 'XEG',
          inlineDynamicImports: true, // 단일 번들 보장
          // R5: 소스맵에 sourcesContent 포함
          sourcemapExcludeSources: false,
          // 실제 산출 파일명은 plugin에서 생성
        },
        treeshake: flags.isProd,
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
        },
      }),
    },
    optimizeDeps: {
      include: ['solid-js', 'solid-js/web', 'solid-js/store'],
      force: flags.isDev,
    },
    server: { port: 3000, hmr: flags.isDev },
    logLevel: flags.isDev ? 'info' : 'warn',
    clearScreen: false,
  };
  return config;
});

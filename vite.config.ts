/**
 * Vite configuration (TypeScript + strict typing)
 * - Dev: sourcemap + unminified
 * - Prod: terser + drop console
 * - Output: single userscript file
 */
import { defineConfig, Plugin, UserConfig } from 'vite';
import preact from '@preact/preset-vite';
import fs from 'node:fs';
import path from 'node:path';
import { OutputBundle, OutputChunk, OutputAsset, NormalizedOutputOptions } from 'rollup';

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

function userscriptHeader(flags: BuildFlags): string {
  const version = flags.isDev ? `${pkg.version}-dev.${Date.now()}` : pkg.version;
  const devSuffix = flags.isDev ? ' (Dev)' : '';
  // Minimal inlined SVG icon (data URI) to keep single-file guarantee
  const iconDataUri =
    'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2232%22 height=%2232%22 viewBox=%220 0 32 32%22%3E%3Crect width=%2232%22 height=%2232%22 rx=%226%22 fill=%22%23000%22/%3E%3Cpath d=%22M7 8h4.5l3 4.5L17.5 8H22l-5.5 8L22 24h-4.5l-3-4.5L11.5 24H7l5.5-8L7 8z%22 fill=%22%23fff%22/%3E%3C/svg%3E';
  return (
    `// ==UserScript==\n` +
    `// @name         X.com Enhanced Gallery${devSuffix}\n` +
    `// @namespace    https://github.com/piesp/xcom-enhanced-gallery\n` +
    `// @version      ${version}\n` +
    `// @description  ${pkg.description || ''}\n` +
    `// @author       PiesP\n` +
    `// @license      MIT\n` +
    `// @match        https://x.com/*\n` +
    `// @match        https://*.x.com/*\n` +
    `// @match        https://twitter.com/*\n` +
    `// @match        https://*.twitter.com/*\n` +
    `// @grant        GM_setValue\n` +
    `// @grant        GM_getValue\n` +
    `// @grant        GM_download\n` +
    `// @grant        GM_xmlhttpRequest\n` +
    `// @connect      x.com\n` +
    `// @connect      api.twitter.com\n` +
    `// @connect      pbs.twimg.com\n` +
    `// @connect      video.twimg.com\n` +
    `// @connect      abs.twimg.com\n` +
    `// @connect      abs-0.twimg.com\n` +
    `// @run-at       document-idle\n` +
    `// @supportURL   https://github.com/piesp/xcom-enhanced-gallery/issues\n` +
    `// @downloadURL  https://github.com/piesp/xcom-enhanced-gallery/releases/latest/download/xcom-enhanced-gallery.user.js\n` +
    `// @updateURL    https://github.com/piesp/xcom-enhanced-gallery/releases/latest/download/xcom-enhanced-gallery.user.js\n` +
    `// @homepageURL  https://github.com/piesp/xcom-enhanced-gallery#readme\n` +
    `// @source       https://github.com/piesp/xcom-enhanced-gallery\n` +
    `// @icon         ${iconDataUri}\n` +
    `// @antifeature  none\n` +
    `// @noframes\n` +
    `// ==/UserScript==\n\n`
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
        ? `// expose bundled css for ShadowRoot consumers\n(function(){try{\n  // 1) 글로벌 변수로 CSS 텍스트 노출 (Shadow DOM 주입용)\n  try{ (globalThis||window).XEG_CSS_TEXT = ${JSON.stringify(cssConcat)}; }catch(_){}\n  // 2) 문서 head 주입 gating: XEG_STYLE_HEAD_MODE ∈ {'auto','off','defer'}\n  var __mode = (globalThis && (globalThis).XEG_STYLE_HEAD_MODE) || 'auto';\n  function __injectHead(){\n    try{\n      var existing=document.getElementById('xeg-styles');\n      if(existing){ return; }\n      var s=document.createElement('style');\n      s.id='xeg-styles';\n      s.textContent=(globalThis&&globalThis.XEG_CSS_TEXT)||${JSON.stringify(cssConcat)};\n      (document.head||document.documentElement).appendChild(s);\n    }catch(err){ console.error('[XEG] style head inject fail', err); }\n  }\n  if(__mode==='auto'){\n    __injectHead();\n  }else if(__mode==='defer'){\n    var raf=(globalThis && globalThis.requestAnimationFrame) ? globalThis.requestAnimationFrame : null;\n    if(raf){ raf(function(){ __injectHead(); }); } else { setTimeout(function(){ __injectHead(); }, 0); }\n  }else if(__mode==='off'){\n    // no-op: ShadowRoot 경로만 사용\n  }\n}catch(e){console.error('[XEG] style inject wrapper fail',e);}})();\n`
        : '';

      // 내부 엔트리 코드에 남아 있을 수 있는 sourceMappingURL 주석 제거
      const cleanedCode = entryChunk.code
        .replace(/\/\/#\s*sourceMappingURL\s*=.*$/gm, '')
        .replace(/\/\*#\s*sourceMappingURL\s*=.*?\*\//gs, '');

      const wrapped = `${userscriptHeader(flags)}(function(){\n'use strict';\n${styleInjector}${cleanedCode}\n})();`;
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
        } catch (err) {
          console.warn('[userscript] failed to append sourceMappingURL comment', err);
        }
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

export default defineConfig(({ mode }) => {
  const flags = resolveFlags(mode);
  const config: UserConfig = {
    plugins: [
      preact({ devToolsEnabled: flags.isDev, prefreshEnabled: flags.isDev }),
      userscriptPlugin(flags),
    ],
    define: {
      __DEV__: flags.isDev,
      __PROD__: flags.isProd,
      __VERSION__: JSON.stringify(pkg.version),
      'process.env.NODE_ENV': JSON.stringify(flags.isProd ? 'production' : 'development'),
      'process.env': '{}',
      global: 'globalThis',
    },
    resolve: {
      alias: {
        '@': path.resolve(process.cwd(), 'src'),
        '@shared': path.resolve(process.cwd(), 'src/shared'),
        '@features': path.resolve(process.cwd(), 'src/features'),
        '@assets': path.resolve(process.cwd(), 'src/assets'),
      },
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
      // Inline all assets to favor single-file userscript policy
      assetsInlineLimit: Number.MAX_SAFE_INTEGER,
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
            passes: 2,
          },
          format: { comments: false },
          mangle: { toplevel: true },
        },
      }),
    },
    optimizeDeps: {
      include: ['preact', 'preact/hooks', '@preact/signals'],
      force: flags.isDev,
    },
    server: { port: 3000, hmr: flags.isDev },
    logLevel: flags.isDev ? 'info' : 'warn',
    clearScreen: false,
  };
  return config;
});

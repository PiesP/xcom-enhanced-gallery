/**
 * Vite 설정 (Userscript 단일 파일 빌드)
 * - Dev: 소스맵 주석 포함, 미압축
 * - Prod: Terser 압축, 소스맵 별도 파일
 * - 산출물: `dist/xcom-enhanced-gallery[.dev].user.js` + `.map`
 */
import { defineConfig, Plugin, UserConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import fs from 'node:fs';
import path from 'node:path';
import { OutputBundle, OutputChunk, OutputAsset, NormalizedOutputOptions } from 'rollup';

// ─────────────────────────────────────────────────────────────────────────────
// Types & Utils
// ─────────────────────────────────────────────────────────────────────────────
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
  return { mode, isDev, isProd: !isDev, sourcemap: true };
}

const pkg: PackageJsonMeta = JSON.parse(fs.readFileSync('./package.json', 'utf8'));

// SolidJS 컴파일 대상 패턴
const solidIncludePatterns = [
  '**/*.solid.{ts,tsx,js,jsx}',
  '**/shared/components/ui/**/*.{ts,tsx,js,jsx}',
  '**/shared/components/isolation/**/*.{ts,tsx,js,jsx}',
  '**/features/gallery/components/KeyboardHelpOverlay/**/*.{ts,tsx,js,jsx}',
  '**/shared/components/LazyIcon.{ts,tsx,js,jsx}',
];

// ─────────────────────────────────────────────────────────────────────────────
// Userscript 헤더
// ─────────────────────────────────────────────────────────────────────────────
function userscriptHeader(flags: BuildFlags): string {
  const version = flags.isDev ? `${pkg.version}-dev.${Date.now()}` : pkg.version;
  const devSuffix = flags.isDev ? ' (Dev)' : '';
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

// ─────────────────────────────────────────────────────────────────────────────
// Userscript 플러그인 (단일 파일 생성 + CSS 주입)
// ─────────────────────────────────────────────────────────────────────────────
function userscriptPlugin(flags: BuildFlags): Plugin {
  return {
    name: 'xeg-userscript-wrapper',
    apply: 'build',
    writeBundle(options: NormalizedOutputOptions, bundle: OutputBundle) {
      const outDir = options.dir ?? 'dist';
      let cssConcat = '';
      let entryChunk: OutputChunk | undefined;
      let sourcemapContent = '';

      // 번들에서 CSS, 소스맵, 엔트리 청크 추출
      for (const fileName of Object.keys(bundle)) {
        const item = bundle[fileName];
        if (!item) continue;

        if (fileName.endsWith('.css') && item.type === 'asset') {
          const asset = item as OutputAsset;
          if (typeof asset.source === 'string') cssConcat += asset.source;
        } else if (fileName.endsWith('.js.map') && item.type === 'asset') {
          const asset = item as OutputAsset;
          if (typeof asset.source === 'string') sourcemapContent = asset.source;
        } else if (item.type === 'chunk' && item.isEntry) {
          entryChunk = item as OutputChunk;
          if (entryChunk.map && flags.isDev) sourcemapContent = JSON.stringify(entryChunk.map);
        }
      }

      if (!entryChunk) {
        console.warn('[userscript] entry chunk not found');
        return;
      }

      // CSS 주입 코드 생성 (XEG_CSS_TEXT + head 주입 gating)
      const styleInjector = cssConcat.trim()
        ? `(function(){try{
  (globalThis||window).XEG_CSS_TEXT=${JSON.stringify(cssConcat)};
  var __mode=(globalThis&&globalThis.XEG_STYLE_HEAD_MODE)||'auto';
  function __injectHead(){
    try{
      if(document.getElementById('xeg-styles'))return;
      var s=document.createElement('style');
      s.id='xeg-styles';
      s.textContent=(globalThis&&globalThis.XEG_CSS_TEXT)||${JSON.stringify(cssConcat)};
      (document.head||document.documentElement).appendChild(s);
    }catch(err){console.error('[XEG] style head inject fail',err);}
  }
  if(__mode==='auto'){__injectHead();}
  else if(__mode==='defer'){
    var raf=globalThis.requestAnimationFrame||null;
    if(raf){raf(function(){__injectHead();});}else{setTimeout(function(){__injectHead();},0);}
  }
}catch(e){console.error('[XEG] style inject wrapper fail',e);}})();\n`
        : '';

      // 엔트리 코드 정리 (기존 sourceMappingURL 제거)
      const cleanedCode = entryChunk.code
        .replace(/\/\/#\s*sourceMappingURL\s*=.*$/gm, '')
        .replace(/\/\*#\s*sourceMappingURL\s*=.*?\*\//gs, '');

      // 최종 Userscript 생성
      const wrapped = `${userscriptHeader(flags)}(function(){\n'use strict';\n${styleInjector}${cleanedCode}\n})();`;
      const finalName = flags.isDev
        ? 'xcom-enhanced-gallery.dev.user.js'
        : 'xcom-enhanced-gallery.user.js';

      fs.writeFileSync(path.join(outDir, finalName), wrapped, 'utf8');

      // 소스맵 파일 생성 (dev/prod 공통)
      if (sourcemapContent) {
        const mapName = flags.isDev
          ? 'xcom-enhanced-gallery.dev.user.js.map'
          : 'xcom-enhanced-gallery.user.js.map';
        fs.writeFileSync(path.join(outDir, mapName), sourcemapContent, 'utf8');

        // Dev only: 파일 끝에 sourceMappingURL 주석 추가
        if (flags.isDev) {
          try {
            const suffix = `\n//# sourceMappingURL=${mapName}`;
            fs.appendFileSync(path.join(outDir, finalName), suffix, 'utf8');
          } catch (err) {
            console.warn('[userscript] failed to append sourceMappingURL comment', err);
          }
        }
        console.log(
          `✅ Sourcemap: ${mapName}${flags.isDev ? ' (comment added)' : ' (no comment)'}`
        );
      }

      console.log(`✅ Userscript: ${finalName}`);

      // 불필요한 파일 정리 (assets 폴더 등)
      const assetsDir = path.join(outDir, 'assets');
      if (fs.existsSync(assetsDir)) fs.rmSync(assetsDir, { recursive: true, force: true });

      const unnecessaryFiles = ['_cleanup_marker'];
      for (const file of unnecessaryFiles) {
        const filePath = path.join(outDir, file);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }

      console.log('🗑️ 불필요한 파일 정리 완료');
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Vite 설정
// ─────────────────────────────────────────────────────────────────────────────
export default defineConfig(({ mode }) => {
  const flags = resolveFlags(mode);

  const config: UserConfig = {
    plugins: [
      solidPlugin({
        include: solidIncludePatterns,
        dev: flags.isDev,
        hot: flags.isDev,
        ssr: false,
        extensions: ['.solid.tsx', '.solid.ts', '.solid.jsx', '.solid.js'],
        solid: {
          generate: 'dom',
          hydratable: false,
        },
      }),
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
        'solid-js/web': 'solid-js/web/dist/web.js',
        'solid-js/jsx-dev-runtime': path.resolve(
          process.cwd(),
          'src/shared/polyfills/solid-jsx-dev-runtime.ts'
        ),
      },
      dedupe: ['solid-js', 'solid-js/web', 'solid-js/store'],
    },

    css: {
      modules: {
        generateScopedName: flags.isDev ? '[name]__[local]__[hash:base64:5]' : '[hash:base64:6]',
        localsConvention: 'camelCaseOnly',
        hashPrefix: 'xeg',
      },
      postcss: './postcss.config.js',
    },

    build: {
      target: 'es2020',
      outDir: 'dist',
      emptyOutDir: flags.isDev,
      cssCodeSplit: false,
      assetsInlineLimit: Number.MAX_SAFE_INTEGER,
      sourcemap: flags.sourcemap,
      minify: flags.isProd ? 'terser' : false,
      reportCompressedSize: flags.isProd,
      rollupOptions: {
        input: 'src/main.ts',
        output: {
          format: 'iife',
          name: 'XEG',
          inlineDynamicImports: true,
          sourcemapExcludeSources: false,
        },
        treeshake: flags.isProd,
      },
      ...(flags.isProd && {
        terserOptions: {
          compress: {
            drop_console: true,
            drop_debugger: true,
            passes: 3,
            pure_funcs: ['logger.debug', 'logger.trace'],
            pure_getters: true,
            unsafe: true,
          },
          format: { comments: false },
          mangle: { toplevel: true },
        },
      }),
    },

    optimizeDeps: {
      include: ['solid-js', 'solid-js/web'],
      force: flags.isDev,
    },

    server: { port: 3000, hmr: flags.isDev },
    logLevel: flags.isDev ? 'info' : 'warn',
    clearScreen: false,
  };

  return config;
});

/**
 * Vite configuration (TypeScript + strict typing)
 * - Dev: sourcemap + unminified
 * - Prod: terser + drop console
 * - Output: single userscript file
 */
import { defineConfig, type Plugin, type UserConfig } from 'vite';
import preact from '@preact/preset-vite';
import fs from 'node:fs';
import path from 'node:path';
import type { OutputBundle, OutputChunk, OutputAsset, NormalizedOutputOptions } from 'rollup';

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
  return { mode, isDev, isProd: !isDev, sourcemap: isDev };
}

const pkg: PackageJsonMeta = JSON.parse(fs.readFileSync('./package.json', 'utf8'));

function userscriptHeader(flags: BuildFlags): string {
  const version = flags.isDev ? `${pkg.version}-dev.${Date.now()}` : pkg.version;
  const devSuffix = flags.isDev ? ' (Dev)' : '';
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
      for (const fileName of Object.keys(bundle)) {
        const item = bundle[fileName];
        if (!item) continue;
        if (fileName.endsWith('.css') && item.type === 'asset') {
          const asset = item as OutputAsset;
          if (typeof asset.source === 'string') {
            cssConcat += asset.source;
            delete bundle[fileName];
          }
        }
        if (item.type === 'chunk' && item.isEntry) entryChunk = item as OutputChunk;
      }
      if (!entryChunk) {
        console.warn('[userscript] entry chunk not found');
        return;
      }
      const styleInjector = cssConcat.trim().length
        ? `(function(){try{var s=document.getElementById('xeg-styles');if(s) s.remove();s=document.createElement('style');s.id='xeg-styles';s.textContent=${JSON.stringify(cssConcat)};(document.head||document.documentElement).appendChild(s);}catch(e){console.error('[XEG] style inject fail',e);}})();\n`
        : '';
      const wrapped = `${userscriptHeader(flags)}(function(){\n'use strict';\n${styleInjector}${entryChunk.code}\n})();`;
      const finalName = flags.isDev
        ? 'xcom-enhanced-gallery.dev.user.js'
        : 'xcom-enhanced-gallery.user.js';
      fs.writeFileSync(path.join(outDir, finalName), wrapped, 'utf8');
      delete bundle[entryChunk.fileName];
      console.log(`✅ Userscript 생성: ${finalName}`);
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
      emptyOutDir: false, // 다중(dev/prod) 빌드 연속 실행 고려
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

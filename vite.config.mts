/* eslint-env node */
/* global process, Buffer, console */
import preact from '@preact/preset-vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';

// __dirname equivalent in ESM
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @typedef {{version:string; description:string; dependencies?: Record<string,string>}} PackageJsonLike */

const isCI = Boolean(process.env.CI || process.env.GITHUB_ACTIONS);
// @ts-ignore - typed via JSDoc typedef above
const pkg = /** @type {PackageJsonLike} */ JSON.parse(fs.readFileSync('./package.json', 'utf8'));

/** @param {string|undefined} v @returns {string} */
function ver(v) {
  return (v || '').replace(/^[^0-9]+/, '');
}

/** @returns {string[]} */
function cdnReq() {
  const d = pkg.dependencies || {};
  return [
    `https://cdn.jsdelivr.net/npm/preact@${ver(d.preact)}/dist/preact.umd.js`,
    `https://cdn.jsdelivr.net/npm/preact@${ver(d.preact)}/hooks/dist/hooks.umd.js`,
    `https://cdn.jsdelivr.net/npm/preact@${ver(d.preact)}/compat/dist/compat.umd.js`,
    `https://cdn.jsdelivr.net/npm/@preact/signals-core@${ver(d['@preact/signals-core'])}/dist/signals-core.min.js`,
    `https://cdn.jsdelivr.net/npm/@preact/signals@${ver(d['@preact/signals'])}/dist/signals.min.js`,
    `https://cdn.jsdelivr.net/npm/fflate@${ver(d.fflate)}/umd/index.js`,
  ];
}

/** @param {boolean} dev @returns {string} */
function header(dev) {
  const version = dev ? `${pkg.version}-dev.${Date.now()}` : pkg.version;
  return [
    '// ==UserScript==',
    `// @name         X.com Enhanced Gallery${dev ? ' (Dev)' : ''}`,
    '// @namespace    https://github.com/piesp/xcom-enhanced-gallery',
    `// @version      ${version}`,
    `// @description  ${pkg.description}`,
    '// @author       PiesP',
    '// @license      MIT',
    '// @match        https://*.x.com/*',
    '// @grant        GM_registerMenuCommand',
    '// @grant        GM_setValue',
    '// @grant        GM_getValue',
    '// @connect      pbs.twimg.com',
    '// @connect      video.twimg.com',
    '// @run-at       document-idle',
    '// @supportURL   https://github.com/piesp/xcom-enhanced-gallery/issues',
    '// @downloadURL  https://github.com/piesp/xcom-enhanced-gallery/releases/latest/download/xcom-enhanced-gallery.user.js',
    '// @updateURL    https://github.com/piesp/xcom-enhanced-gallery/releases/latest/download/xcom-enhanced-gallery.user.js',
    '// @noframes',
    ...cdnReq().map(u => '// @require     ' + u),
    '',
    '// ==/UserScript==',
    '',
  ].join('\n');
}

/** @param {string} mode @returns {import('vite').Plugin} */
function bundlePlugin(mode) {
  return {
    name: 'userscript-bundle',
    apply: 'build',
    async writeBundle(options, bundle) {
      const outDir = (options && options.dir) || 'dist';
      const entries = Object.entries(bundle);
      const jsEntry = entries.find(
        ([, v]) => v && v.type === 'chunk' && v.fileName.endsWith('.js')
      );
      if (!jsEntry) {
        console.warn('[userscript-bundle] no js chunk');
        return;
      }
      const [fileName] = jsEntry;
      const jsPath = path.join(outDir, fileName);
      const cssSet = new Set(
        entries
          .filter(([, v]) => v && v.type === 'asset' && v.fileName.endsWith('.css'))
          .map(([, v]) => /** @type {any} */ v.fileName)
      );
      for (const [, v] of entries) {
        // vite internal metadata
        const imported =
          v && /** @type {any} */ v.viteMetadata && /** @type {any} */ v.viteMetadata.importedCss;
        if (Array.isArray(imported)) imported.forEach(c => /\.css$/.test(c) && cssSet.add(c));
      }
      let css = '';
      for (const f of cssSet) {
        const p = path.join(outDir, f);
        if (fs.existsSync(p)) {
          css += fs
            .readFileSync(p, 'utf8')
            .replace(/\/\*[\s\S]*?\*\//g, '')
            .replace(/\s+/g, ' ')
            .trim();
          try {
            fs.unlinkSync(p);
          } catch {
            /* ignore unlink error */
          }
        }
      }
      const jsCode = fs.readFileSync(jsPath, 'utf8');
      const cssInject = css
        ? `(function(){if(typeof document==='undefined')return;let s=document.getElementById('xeg-styles');if(s) s.remove();s=document.createElement('style');s.id='xeg-styles';s.textContent=${JSON.stringify(css)};(document.head||document.documentElement).appendChild(s);} )();`
        : '';
      const vendorAlias = `var __g=(typeof window!=='undefined'?window:globalThis);var __u=(typeof unsafeWindow!=='undefined'?unsafeWindow:__g);var preact=__g.preact||__u.preact;var preactHooks=__g.preactHooks||__u.preactHooks;var preactCompat=__g.preactCompat||__u.preactCompat;var signals=(__g.preactSignals||__g.signals||__u.preactSignals||__u.signals);var fflate=__g.fflate||__u.fflate;`;
      const devDiag =
        mode === 'development'
          ? `try{var g=(typeof window!=='undefined'?window:globalThis);console.log('[XEG][Dev] Vendor readiness:',{preact:!!g.preact,hooks:!!g.preactHooks,compat:!!g.preactCompat,signals:!!(g.preactSignals||g.signals)});}catch(e){console.warn('[XEG][Dev] vendor diag failed',e);}`
          : '';
      const wrapped =
        header(mode === 'development') +
        `(function(){'use strict';${cssInject}${devDiag}try{${vendorAlias}\n${jsCode}\n}catch(e){console.error('[XEG] init failed',e);}})();`;
      const outName =
        mode === 'development'
          ? 'xcom-enhanced-gallery.dev.user.js'
          : 'xcom-enhanced-gallery.user.js';
      const outPath = path.join(outDir, outName);
      fs.writeFileSync(outPath, wrapped, 'utf8');
      const mapPath = jsPath + '.map';
      if (fs.existsSync(mapPath)) {
        try {
          const m = JSON.parse(fs.readFileSync(mapPath, 'utf8'));
          m.file = outName;
          fs.writeFileSync(outPath + '.map', JSON.stringify(m));
        } catch {
          fs.copyFileSync(mapPath, outPath + '.map');
        }
      }
      if (outName !== fileName) {
        try {
          fs.unlinkSync(jsPath);
        } catch {
          /* ignore cleanup error */
        }
      }
      console.log('[userscript-bundle] wrote', outName);
    },
  };
}

/** @typedef {{brotli?: boolean; gzip?: boolean}} CompressOptions */

/** @param {CompressOptions} [opts] @returns {import('vite').Plugin} */
function compressMaps(opts = { brotli: true, gzip: true }) {
  return {
    name: 'compress-maps',
    apply: 'build',
    enforce: 'post',
    async writeBundle(options, bundle) {
      if (!isCI) return; // only in CI to keep local iteration fast
      const z = await import('zlib');
      const outDir = (options && options.dir) || 'dist';

      /** @param {string} file @param {Buffer|string} source */
      const writeVariants = (file, source) => {
        const buf = Buffer.isBuffer(source) ? source : Buffer.from(source);
        if (opts.gzip) {
          try {
            const gz = z.gzipSync(buf);
            fs.writeFileSync(path.join(outDir, file + '.gz'), gz);
            process.stdout.write(`[compress-maps] gz ${file}\n`);
          } catch {
            /* ignore gzip failure */
          }
        }
        if (opts.brotli && typeof z.brotliCompressSync === 'function') {
          try {
            const br = z.brotliCompressSync(buf, {
              params: { [z.constants.BROTLI_PARAM_QUALITY]: 11 },
            });
            fs.writeFileSync(path.join(outDir, file + '.br'), br);
            process.stdout.write(`[compress-maps] br ${file}\n`);
          } catch {
            /* ignore brotli failure */
          }
        }
      };

      // Bundle provided assets
      for (const [f, v] of Object.entries(bundle)) {
        if (f.endsWith('.map') && v && v.type === 'asset') {
          writeVariants(f, /** @type {any} */ v.source);
        }
      }
      // Scan output directory (covers renamed userscript map)
      try {
        for (const f of fs.readdirSync(outDir)) {
          if (!f.endsWith('.map')) continue;
          const gzipPath = path.join(outDir, f + '.gz');
          const brPath = path.join(outDir, f + '.br');
          const needGzip = opts.gzip && !fs.existsSync(gzipPath);
          const needBr = opts.brotli && !fs.existsSync(brPath);
          if (!needGzip && !needBr) continue;
          try {
            const buf = fs.readFileSync(path.join(outDir, f));
            writeVariants(f, buf);
          } catch {
            /* ignore read/compress error */
          }
        }
      } catch {
        /* ignore directory read errors */
      }
    },
  };
}

export default defineConfig(({ mode }) => {
  // derive dev flag inline when needed to avoid unused variable lint noise
  const dev = mode === 'development';
  return {
    plugins: [
      preact({ devToolsEnabled: dev, prefreshEnabled: dev && !isCI }),
      bundlePlugin(mode),
      compressMaps(),
    ],
    define: {
      'process.env.NODE_ENV': JSON.stringify(dev ? 'development' : 'production'),
      'process.env': '{}',
      global: 'globalThis',
      __DEV__: dev,
      __PROD__: !dev,
      __VERSION__: JSON.stringify(pkg.version),
    },
    build: {
      target: 'es2020',
      outDir: 'dist',
      emptyOutDir: false,
      cssCodeSplit: false,
      sourcemap: true,
      minify: !dev ? 'terser' : false,
      rollupOptions: {
        input: 'src/main.ts',
        external: ['preact', 'preact/hooks', 'preact/compat', '@preact/signals', 'fflate'],
        output: {
          entryFileNames: 'xeg.tmp.js',
          format: 'iife',
          name: 'XG',
          globals: {
            preact: 'preact',
            'preact/hooks': 'preactHooks',
            'preact/compat': 'preactCompat',
            '@preact/signals': 'signals',
            fflate: 'fflate',
          },
          inlineDynamicImports: true,
        },
        treeshake: {
          moduleSideEffects: id => /\.(css|scss)(\?|$)/i.test(id || ''),
          preset: 'smallest',
        },
      },
      terserOptions: !dev
        ? {
            compress: {
              drop_console: !dev || isCI,
              drop_debugger: true,
              pure_funcs: !dev || isCI ? ['console.log', 'console.debug'] : [],
            },
            mangle: { toplevel: true },
            // 라이선스 배너(특히 lucide-preact)가 아이콘 개별 모듈마다 반복되므로
            // 첫 1개만 유지하고 나머지는 제거하여 번들 크기와 가독성 개선
            format: {
              comments: (() => {
                /** 유지할 첫 lucide-preact 라이선스만 true */
                let lucideKept = false;
                const lucideRe = /@license\s+lucide-preact/i;
                const genericKeep = /@license|@preserve|copyright/i;
                return (_node, comment) => {
                  if (!comment || typeof comment.value !== 'string') return false;
                  const v = comment.value;
                  if (lucideRe.test(v)) {
                    if (lucideKept) return false; // 중복 제거
                    lucideKept = true;
                    return true;
                  }
                  // 다른 라이선스 표기는 기본 패턴 유지
                  return genericKeep.test(v);
                };
              })(),
            },
          }
        : undefined,
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '@shared': path.resolve(__dirname, 'src/shared'),
        '@features': path.resolve(__dirname, 'src/features'),
        '@core': path.resolve(__dirname, 'src/core'),
        '@assets': path.resolve(__dirname, 'src/assets'),
      },
    },
    optimizeDeps: { include: ['preact', 'preact/hooks', 'preact/compat', '@preact/signals'] },
    logLevel: isCI ? 'error' : dev ? 'info' : 'warn',
    clearScreen: false,
  };
});

// end

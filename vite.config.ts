import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import type {
  NormalizedOutputOptions,
  OutputAsset,
  OutputBundle,
  OutputChunk,
  RolldownOptions,
} from 'rolldown';
import type { BuildOptions, Plugin, PluginOption, UserConfig } from 'vite';
import { defineConfig, mergeConfig } from 'vite';
import monkey from 'vite-plugin-monkey';
import solidPlugin from 'vite-plugin-solid';

const STYLE_ID = 'xeg-styles';
const ERR_EVENT = 'xeg:style-error';
const require = createRequire(import.meta.url);

type AliasEntry = {
  find: string;
  replacement: string;
};

type Tsconfig = {
  compilerOptions?: {
    paths?: Record<string, string[]>;
  };
};

const resolveFromImportMeta = (relativePath: string) => {
  if (!import.meta.url.startsWith('file:')) {
    return null;
  }

  try {
    const candidate = new URL(relativePath, import.meta.url);
    if (candidate.protocol !== 'file:') {
      return null;
    }
    return fileURLToPath(candidate);
  } catch {
    return null;
  }
};

const resolvedProjectRoot = resolveFromImportMeta('.');
const projectRoot = resolvedProjectRoot ?? process.cwd();
const resolvedTsconfigPath = resolveFromImportMeta('./tsconfig.json');
const defaultTsconfigPath = resolvedTsconfigPath ?? path.resolve(projectRoot, 'tsconfig.json');

const stripWildcard = (value: string) => (value.endsWith('/*') ? value.slice(0, -2) : value);

function getTsconfigAliasEntries(tsconfigPath: string = defaultTsconfigPath): AliasEntry[] {
  const raw = fs.readFileSync(tsconfigPath, 'utf8');
  const tsconfig = JSON.parse(raw) as Tsconfig;
  const configuredPaths = tsconfig.compilerOptions?.paths ?? {};

  return Object.keys(configuredPaths)
    .sort()
    .map(aliasKey => {
      const targets = configuredPaths[aliasKey];
      if (!targets?.length) return null;

      const [firstTarget] = targets;
      if (!firstTarget) {
        return null;
      }

      const replacement = stripWildcard(firstTarget);
      return {
        find: stripWildcard(aliasKey),
        replacement: path.resolve(projectRoot, replacement),
      };
    })
    .filter((entry): entry is AliasEntry => Boolean(entry));
}

export const createStyleInjector = (css: string, isDev: boolean) => {
  if (!css.trim()) return '';
  // Security: Escape < to prevent script injection when embedding in HTML
  const content = JSON.stringify(css).replace(/</g, '\\u003c');
  const errHandler = `var d=e instanceof Error?{message:e.message,stack:e.stack||''}:{message:String(e)},t=typeof window!=='undefined'?window:typeof globalThis!=='undefined'?globalThis:null;if(t&&t.dispatchEvent){var n;if(typeof CustomEvent==='function')n=new CustomEvent('${ERR_EVENT}',{detail:d});else if(document&&document.createEvent){n=document.createEvent('CustomEvent');n.initCustomEvent('${ERR_EVENT}',false,false,d)}if(n)t.dispatchEvent(n)}`;

  const script = `try{var s=document.getElementById('${STYLE_ID}');if(s)s.remove();s=document.createElement('style');s.id='${STYLE_ID}';s.textContent=${content};(document.head||document.documentElement).appendChild(s)}catch(e){${errHandler}}`;

  return isDev ? `(function(){${script}})();` : `(function(){${script}})();`;
};

const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
const viteMeta = JSON.parse(fs.readFileSync(require.resolve('vite/package.json'), 'utf8'));
const forcedFlavor = process.env.XEG_FORCE_VITE_FLAVOR?.toLowerCase();
const isRolldownPreview =
  forcedFlavor === 'preview'
    ? true
    : forcedFlavor === 'main'
    ? false
    : viteMeta.name === 'rolldown-vite';

const getLicenseNotices = () => {
  const files = [
    { path: './LICENSES/solid-js-MIT.txt', name: 'Solid.js' },
    { path: './LICENSES/heroicons-MIT.txt', name: 'Heroicons' },
  ];
  let notices = '/*\n * Third-Party Licenses\n * ====================\n';
  files.forEach(({ path: p, name }) => {
    try {
      if (fs.existsSync(p))
        notices += ` *\n * ${name}:\n${fs
          .readFileSync(p, 'utf8')
          .split('\n')
          .map(l => ` * ${l}`.trimEnd())
          .join('\n')}\n`;
    } catch (e) {
      console.warn(`[license] Failed to read ${name}:`, e);
    }
  });
  return notices + ' */\n';
};

const getUserscriptHeader = (isDev: boolean) => {
  const timestamp = new Date().toISOString().replace(/[-:T]/g, '.').slice(0, 15);
  const version = isDev ? `${pkg.version}-dev.${timestamp}` : pkg.version;
  // jsDelivr CDN provides faster updates and better caching than GitHub releases
  // Format: https://cdn.jsdelivr.net/gh/user/repo@version/file
  const cdnBase = 'https://cdn.jsdelivr.net/gh/PiesP/xcom-enhanced-gallery';
  const prodOnlyMetadata = isDev
    ? ''
    : `// @supportURL   https://github.com/PiesP/xcom-enhanced-gallery/issues
// @downloadURL  ${cdnBase}@v${pkg.version}/dist/xcom-enhanced-gallery.user.js
// @updateURL    ${cdnBase}@v${pkg.version}/dist/xcom-enhanced-gallery.user.js
`;
  return `// ==UserScript==
// @name         X.com Enhanced Gallery${isDev ? ' (Dev)' : ''}
// @namespace    https://github.com/PiesP/xcom-enhanced-gallery
// @version      ${version}
// @description  ${pkg.description || ''}
// @author       PiesP
// @license      MIT
// @match        https://*.x.com/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_download
// @grant        GM_notification
// @grant        GM_xmlhttpRequest
// @connect      pbs.twimg.com
// @connect      video.twimg.com
// @connect      api.twitter.com
// @run-at       document-idle
${prodOnlyMetadata}// @noframes
// ==/UserScript==
`;
};

const userscriptPlugin = (isDev: boolean, isProd: boolean): Plugin => ({
  name: 'xeg-userscript',
  apply: 'build',
  writeBundle(options: NormalizedOutputOptions, bundle: OutputBundle) {
    const outDir = options.dir ?? 'dist';
    let css = '',
      entry: OutputChunk | undefined,
      map = '';

    for (const key in bundle) {
      const item = bundle[key];
      if (!item) continue;

      if (item.type === 'asset' && key.endsWith('.css')) {
        css += (item as OutputAsset).source;
      } else if (item.type === 'asset' && key.endsWith('.js.map')) {
        map = (item as OutputAsset).source as string;
      } else if (item.type === 'chunk' && item.isEntry) {
        entry = item as OutputChunk;
        if (entry.map && isDev) map = JSON.stringify(entry.map);
      }
    }

    if (!entry) return console.warn('[userscript] No entry chunk');

    const styleInjector = createStyleInjector(css, isDev);
    const code = entry.code
      .replace(/\/\/#\s*sourceMappingURL\s*=.*$/gm, '')
      .replace(/\/\*#\s*sourceMappingURL\s*=.*?\*\//gs, '');
    const header = getUserscriptHeader(isDev);
    const license = isProd ? getLicenseNotices() : '';

    const wrapper = isProd
      ? `${header}${license}${styleInjector}${code}`
      : `${header}${license}${styleInjector}\n(function() {\n'use strict';\n${code}\n})();`;

    const fileName = isDev ? 'xcom-enhanced-gallery.dev.user.js' : 'xcom-enhanced-gallery.user.js';
    fs.writeFileSync(path.join(outDir, fileName), wrapper);

    if (isDev && map) {
      const mapName = `${fileName}.map`;
      fs.writeFileSync(path.join(outDir, mapName), map);
      fs.appendFileSync(path.join(outDir, fileName), `\n//# sourceMappingURL=${mapName}`);
    }

    console.info(`[userscript] Generated ${fileName}`);

    const assetsDir = path.join(outDir, 'assets');
    if (fs.existsSync(assetsDir)) fs.rmSync(assetsDir, { recursive: true, force: true });
  },
});

type FutureUserConfig = UserConfig & { oxc?: Record<string, unknown> };
type FutureBuildOptions = BuildOptions & { rolldownOptions?: RolldownOptions };
type TransformerConfig =
  | { esbuild: NonNullable<UserConfig['esbuild']> }
  | { oxc: Record<string, unknown> };

export default defineConfig(async ({ mode, command }) => {
  const isDev = mode === 'development';
  const isProd = !isDev;
  const analyze = isProd && process.env.XEG_ENABLE_BUNDLE_ANALYSIS === 'true';
  const classFieldCompilerOptions = { useDefineForClassFields: false } as const;

  const transformerConfig: TransformerConfig = isRolldownPreview
    ? {
        esbuild: {
          jsx: 'preserve',
          jsxImportSource: 'solid-js',
          tsconfigRaw: { compilerOptions: classFieldCompilerOptions },
        },
      }
    : {
        oxc: {
          jsx: 'preserve',
          typescript: {
            removeClassFieldsWithoutInitializer: true,
          },
          assumptions: {
            setPublicClassFields: true,
          },
        },
      };

  const baseBundlerOptions = {
    input: 'src/main.ts',
    output: {
      format: 'iife' as const,
      name: 'XEG',
      inlineDynamicImports: true as const,
    },
    treeshake: isProd,
  };

  const rollupBundlerOptions = {
    ...baseBundlerOptions,
    maxParallelFileOps: 10,
  };

  const rolldownBundlerOptions: RolldownOptions = {
    ...baseBundlerOptions,
  };

  // Greasy Fork Code Rules Compliance:
  // - Code must NOT be obfuscated or minified
  // - Users must be able to inspect and understand the script before installing
  // - See: https://greasyfork.org/en/help/code-rules
  const buildConfig: FutureBuildOptions = {
    target: 'esnext',
    outDir: 'dist',
    emptyOutDir: false, // Handled by clean script to avoid race conditions in parallel builds
    cssCodeSplit: false,
    assetsInlineLimit: 0,
    sourcemap: isDev,
    // Greasy Fork requires readable, non-minified code
    minify: false,
    reportCompressedSize: true,
    chunkSizeWarningLimit: 1000,
  };

  if (isRolldownPreview) {
    buildConfig.rollupOptions = rollupBundlerOptions;
  } else {
    buildConfig.rolldownOptions = rolldownBundlerOptions;
  }

  const aliasEntries = getTsconfigAliasEntries();

  const config: FutureUserConfig = {
    ...transformerConfig,
    plugins: [
      solidPlugin({ dev: isDev, ssr: false }),
      command === 'serve'
        ? monkey({
            entry: 'src/main.ts',
            userscript: {
              name: 'X.com Enhanced Gallery' + (isDev ? ' (Dev)' : ''),
              namespace: 'https://github.com/PiesP/xcom-enhanced-gallery',
              match: ['https://*.x.com/*'],
              grant: [
                'GM_setValue',
                'GM_getValue',
                'GM_download',
                'GM_notification',
                'GM_xmlhttpRequest',
              ],
              connect: ['pbs.twimg.com', 'video.twimg.com', 'api.twitter.com'],
            },
          })
        : userscriptPlugin(isDev, isProd),
      analyze,
    ].filter(Boolean) as PluginOption[],
    define: {
      __DEV__: isDev,
      __IS_DEV__: isDev,
      __VERSION__: JSON.stringify(pkg.version),
      'process.env.NODE_ENV': JSON.stringify(isProd ? 'production' : 'development'),
      'process.env': '{}',
      global: 'globalThis',
      __FEATURE_MEDIA_EXTRACTION__: process.env.ENABLE_MEDIA_EXTRACTION !== 'false',
    },
    resolve: {
      alias: aliasEntries,
      tsconfigPaths: true,
    },
    css: {
      modules: {
        // Greasy Fork compliance: Keep readable class names in all builds
        generateScopedName: '[name]__[local]__[hash:base64:5]',
        localsConvention: 'camelCaseOnly',
        hashPrefix: 'xeg',
      },
      postcss: './postcss.config.js',
    },
    build: buildConfig,
    optimizeDeps: {
      include: ['solid-js', 'solid-js/web'],
      exclude: ['test'],
      force: isDev,
    },
    server: {
      port: 3000,
      middlewareMode: false,
      hmr: isDev ? { protocol: 'ws', host: 'localhost', port: 5173 } : false,
    },
    logLevel: isDev ? 'info' : 'warn',
    clearScreen: false,
    experimental: {
      enableNativePlugin: 'resolver',
    },
    future: 'warn',
  };

  const localConfigPath = path.resolve(process.cwd(), 'config.local.js');

  if (!fs.existsSync(localConfigPath)) {
    return config;
  }

  try {
    const localModule = await import(`${pathToFileURL(localConfigPath).href}?ts=${Date.now()}`);
    const local = await localModule.loadLocalConfig?.();
    return local ? mergeConfig(config, local) : config;
  } catch (error) {
    console.warn('[vite-config] Failed to load config.local.js', error);
    return config;
  }
});

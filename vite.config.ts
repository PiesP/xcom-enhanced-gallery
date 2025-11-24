import fs from "node:fs";
import path from "node:path";
import type {
    NormalizedOutputOptions,
    OutputAsset,
    OutputBundle,
    OutputChunk,
} from "rollup";
import { visualizer } from "rollup-plugin-visualizer";
import type { Plugin, PluginOption, UserConfig } from "vite";
import { defineConfig, mergeConfig } from "vite";
import monkey from "vite-plugin-monkey";
import solidPlugin from "vite-plugin-solid";
import tsconfigPaths from "vite-tsconfig-paths";

const STYLE_ID = "xeg-styles";
const ERR_EVENT = "xeg:style-error";

export const createStyleInjector = (css: string, isDev: boolean) => {
  if (!css.trim()) return "";
  // Security: Escape < to prevent script injection when embedding in HTML
  const content = JSON.stringify(css).replace(/</g, "\\u003c");
  const errHandler = `var d=e instanceof Error?{message:e.message,stack:e.stack||''}:{message:String(e)},t=typeof window!=='undefined'?window:typeof globalThis!=='undefined'?globalThis:null;if(t&&t.dispatchEvent){var n;if(typeof CustomEvent==='function')n=new CustomEvent('${ERR_EVENT}',{detail:d});else if(document&&document.createEvent){n=document.createEvent('CustomEvent');n.initCustomEvent('${ERR_EVENT}',false,false,d)}if(n)t.dispatchEvent(n)}`;

  const script = `try{var s=document.getElementById('${STYLE_ID}');if(s)s.remove();s=document.createElement('style');s.id='${STYLE_ID}';s.textContent=${content};(document.head||document.documentElement).appendChild(s)}catch(e){${errHandler}}`;

  return isDev ? `(function(){${script}})();` : `(function(){${script}})();`;
};

const pkg = JSON.parse(fs.readFileSync("./package.json", "utf8"));

const getLicenseNotices = () => {
  const files = [
    { path: "./LICENSES/solid-js-MIT.txt", name: "Solid.js" },
    { path: "./LICENSES/heroicons-MIT.txt", name: "Heroicons" },
  ];
  let notices = "/*\n * Third-Party Licenses\n * ====================\n";
  files.forEach(({ path: p, name }) => {
    try {
      if (fs.existsSync(p))
        notices += ` *\n * ${name}:\n${fs
          .readFileSync(p, "utf8")
          .split("\n")
          .map((l) => ` * ${l}`.trimEnd())
          .join("\n")}\n`;
    } catch (e) {
      console.warn(`[license] Failed to read ${name}:`, e);
    }
  });
  return notices + " */\n";
};

const getUserscriptHeader = (isDev: boolean) => {
  const timestamp = new Date()
    .toISOString()
    .replace(/[-:T]/g, ".")
    .slice(0, 15);
  const version = isDev ? `${pkg.version}-dev.${timestamp}` : pkg.version;
  return `// ==UserScript==
// @name         X.com Enhanced Gallery${isDev ? " (Dev)" : ""}
// @namespace    https://github.com/piesp/xcom-enhanced-gallery
// @version      ${version}
// @description  ${pkg.description || ""}
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
// @supportURL   https://github.com/piesp/xcom-enhanced-gallery/issues
// @downloadURL  https://github.com/piesp/xcom-enhanced-gallery/releases/latest/download/xcom-enhanced-gallery.user.js
// @updateURL    https://github.com/piesp/xcom-enhanced-gallery/releases/latest/download/xcom-enhanced-gallery.user.js
// @noframes
// ==/UserScript==
`;
};

const userscriptPlugin = (isDev: boolean, isProd: boolean): Plugin => ({
  name: "xeg-userscript",
  apply: "build",
  writeBundle(options: NormalizedOutputOptions, bundle: OutputBundle) {
    const outDir = options.dir ?? "dist";
    let css = "",
      entry: OutputChunk | undefined,
      map = "";

    for (const key in bundle) {
      const item = bundle[key];
      if (!item) continue;

      if (item.type === "asset" && key.endsWith(".css")) {
        css += (item as OutputAsset).source;
      } else if (item.type === "asset" && key.endsWith(".js.map")) {
        map = (item as OutputAsset).source as string;
      } else if (item.type === "chunk" && item.isEntry) {
        entry = item as OutputChunk;
        if (entry.map && isDev) map = JSON.stringify(entry.map);
      }
    }

    if (!entry) return console.warn("[userscript] No entry chunk");

    const styleInjector = createStyleInjector(css, isDev);
    const code = entry.code
      .replace(/\/\/#\s*sourceMappingURL\s*=.*$/gm, "")
      .replace(/\/\*#\s*sourceMappingURL\s*=.*?\*\//gs, "");
    const header = getUserscriptHeader(isDev);
    const license = isProd ? getLicenseNotices() : "";

    const wrapper = isProd
      ? `${header}${license}${styleInjector}${code}`
      : `${header}${license}${styleInjector}\n(function() {\n'use strict';\n${code}\n})();`;

    const fileName = isDev
      ? "xcom-enhanced-gallery.dev.user.js"
      : "xcom-enhanced-gallery.user.js";
    fs.writeFileSync(path.join(outDir, fileName), wrapper);

    if (isDev && map) {
      const mapName = `${fileName}.map`;
      fs.writeFileSync(path.join(outDir, mapName), map);
      fs.appendFileSync(
        path.join(outDir, fileName),
        `\n//# sourceMappingURL=${mapName}`,
      );
    }

    console.log(`[userscript] Generated ${fileName}`);

    const assetsDir = path.join(outDir, "assets");
    if (fs.existsSync(assetsDir))
      fs.rmSync(assetsDir, { recursive: true, force: true });
  },
});

export default defineConfig(async ({ mode, command }) => {
  const isDev = mode === "development";
  const isProd = !isDev;
  const analyze = isProd && process.env.XEG_ENABLE_BUNDLE_ANALYSIS === "true";

  const config: UserConfig = {
    plugins: [
      solidPlugin({ dev: isDev, ssr: false }),
      tsconfigPaths(),
      command === "serve"
        ? monkey({
            entry: "src/main.ts",
            userscript: {
              name: "X.com Enhanced Gallery" + (isDev ? " (Dev)" : ""),
              namespace: "https://github.com/piesp/xcom-enhanced-gallery",
              match: ["https://*.x.com/*"],
              grant: [
                "GM_setValue",
                "GM_getValue",
                "GM_download",
                "GM_notification",
                "GM_xmlhttpRequest",
              ],
              connect: ["pbs.twimg.com", "video.twimg.com", "api.twitter.com"],
            },
          })
        : userscriptPlugin(isDev, isProd),
      analyze &&
        visualizer({
          filename: "docs/bundle-analysis.html",
          gzipSize: true,
          brotliSize: true,
          template: "treemap",
        }),
    ].filter(Boolean) as PluginOption[],
    define: {
      __DEV__: isDev,
      __IS_DEV__: isDev,
      __VERSION__: JSON.stringify(pkg.version),
      "process.env.NODE_ENV": JSON.stringify(
        isProd ? "production" : "development",
      ),
      "process.env": "{}",
      global: "globalThis",
      __FEATURE_MEDIA_EXTRACTION__:
        process.env.ENABLE_MEDIA_EXTRACTION !== "false",
    },
    esbuild: {
      jsx: "preserve",
      jsxImportSource: "solid-js",
      tsconfigRaw: { compilerOptions: { useDefineForClassFields: false } },
    },
    css: {
      modules: {
        generateScopedName: isDev
          ? "[name]__[local]__[hash:base64:5]"
          : "[hash:base64:6]",
        localsConvention: "camelCaseOnly",
        hashPrefix: "xeg",
      },
      postcss: "./postcss.config.js",
    },
    build: {
      target: "baseline-widely-available",
      outDir: "dist",
      emptyOutDir: isDev,
      cssCodeSplit: false,
      assetsInlineLimit: 0,
      sourcemap: isDev,
      minify: isProd ? "terser" : false,
      reportCompressedSize: false,
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        input: "src/main.ts",
        output: {
          format: "iife",
          name: "XEG",
          inlineDynamicImports: true,
          sourcemapExcludeSources: false,
        },
        treeshake: isProd,
        maxParallelFileOps: 10,
      },
      ...(isProd
        ? {
            terserOptions: {
              compress: {
                drop_console: true,
                drop_debugger: true,
                pure_funcs: [
                  "console.info",
                  "console.debug",
                  "logger.debug",
                  "logger.info",
                ],
                passes: 5,
                pure_getters: true,
                unsafe: true,
                unsafe_methods: true,
                toplevel: true,
              },
              format: { comments: false },
              mangle: { toplevel: true },
              maxWorkers: 8,
            },
          }
        : {}),
    },
    optimizeDeps: {
      include: ["solid-js", "solid-js/web", "solid-js/store"],
      exclude: ["test"],
      force: isDev,
    },
    server: {
      port: 3000,
      middlewareMode: false,
      hmr: isDev ? { protocol: "ws", host: "localhost", port: 5173 } : false,
    },
    logLevel: isDev ? "info" : "warn",
    clearScreen: false,
    future: "warn",
  };

  try {
    // @ts-expect-error: Optional local config
    const { loadLocalConfig } = await import("./config.local.js");
    const local = await loadLocalConfig();
    return local ? mergeConfig(config, local) : config;
  } catch {
    return config;
  }
});

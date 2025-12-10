// vite.config.ts
import { resolve } from "node:path";
import { defineConfig } from "file:///home/piesp/projects/xcom-enhanced-gallery/node_modules/.deno/vite@8.0.0-beta.1/node_modules/vite/dist/node/index.js";
import solidPlugin from "file:///home/piesp/projects/xcom-enhanced-gallery/node_modules/.deno/vite-plugin-solid@2.11.10/node_modules/vite-plugin-solid/dist/esm/index.mjs";
var STYLE_ID = "xeg-injected-styles";
var OUTPUT_FILE_NAMES = {
  dev: "xcom-enhanced-gallery.dev.user.js",
  prod: "xcom-enhanced-gallery.user.js"
};
var PATH_ALIASES = {
  "@": "src",
  "@bootstrap": "src/bootstrap",
  "@constants": "src/constants",
  "@features": "src/features",
  "@shared": "src/shared",
  "@styles": "src/styles",
  "@types": "src/types"
};
var BUILD_MODE_CONFIGS = {
  development: {
    cssCompress: false,
    cssRemoveComments: false,
    cssVariableShortening: false,
    cssValueMinify: false,
    cssClassNamePattern: "[name]__[local]__[hash:base64:5]",
    sourceMap: "inline",
    outputSuffix: ".dev"
  },
  production: {
    cssCompress: true,
    cssRemoveComments: true,
    cssVariableShortening: true,
    cssValueMinify: true,
    cssClassNamePattern: "xeg_[hash:base64:6]",
    sourceMap: false,
    outputSuffix: ""
  }
};
function getBuildModeConfig(mode) {
  return BUILD_MODE_CONFIGS[mode === "development" ? "development" : "production"];
}
function removeCssComments(css) {
  let result = "";
  let i = 0;
  let inString = false;
  let stringChar = "";
  while (i < css.length) {
    if (!inString && (css[i] === '"' || css[i] === "'")) {
      inString = true;
      stringChar = css[i];
      result += css[i];
      i++;
      continue;
    }
    if (inString) {
      if (css[i] === stringChar && css[i - 1] !== "\\") {
        inString = false;
      }
      result += css[i];
      i++;
      continue;
    }
    if (css[i] === "/" && css[i + 1] === "*") {
      const commentEnd = css.indexOf("*/", i + 2);
      if (commentEnd === -1) break;
      i = commentEnd + 2;
      if (result.length > 0 && result[result.length - 1] !== " " && result[result.length - 1] !== "\n") {
        result += " ";
      }
      continue;
    }
    result += css[i];
    i++;
  }
  return result.replace(/  +/g, " ").replace(/\n\s*\n/g, "\n").replace(/^\s+/gm, "").replace(/\s+$/gm, "").trim();
}
var CSS_VAR_SHORTENING_MAP = {
  // Easing/Animation
  "--xeg-ease-standard": "--xe-s",
  "--xeg-ease-decelerate": "--xe-d",
  "--xeg-ease-accelerate": "--xe-a",
  "--xeg-ease-entrance": "--xe-e",
  "--xeg-easing-ease-out": "--xeo",
  "--xeg-easing-ease-in": "--xei",
  "--xeg-easing-linear": "--xel",
  // Duration
  "--xeg-duration": "--xd",
  "--xeg-duration-fast": "--xdf",
  "--xeg-duration-normal": "--xdn",
  "--xeg-duration-slow": "--xds",
  "--xeg-duration-toolbar": "--xdt",
  // Transitions
  "--xeg-transition-interaction-fast": "--xti",
  "--xeg-transition-surface-fast": "--xts",
  "--xeg-transition-surface-normal": "--xtsn",
  "--xeg-transition-elevation-fast": "--xtef",
  "--xeg-transition-elevation-normal": "--xten",
  "--xeg-transition-width-normal": "--xtwn",
  "--xeg-transition-opacity": "--xto",
  "--xeg-transition-toolbar": "--xtt",
  // Colors - Text
  "--xeg-color-text-primary": "--xct-p",
  "--xeg-color-text-secondary": "--xct-s",
  "--xeg-color-text-tertiary": "--xct-t",
  "--xeg-color-text-inverse": "--xct-i",
  // Colors - Border
  "--xeg-color-border-primary": "--xcb-p",
  "--xeg-color-border-hover": "--xcb-h",
  "--xeg-color-border-strong": "--xcb-s",
  // Colors - Background
  "--xeg-color-bg-primary": "--xcbg-p",
  "--xeg-color-bg-secondary": "--xcbg-s",
  // Colors - Semantic
  "--xeg-color-primary": "--xc-p",
  "--xeg-color-primary-hover": "--xc-ph",
  "--xeg-color-success": "--xc-s",
  "--xeg-color-success-hover": "--xc-sh",
  "--xeg-color-error": "--xc-e",
  "--xeg-color-error-hover": "--xc-eh",
  "--xeg-color-overlay-medium": "--xc-om",
  "--xeg-color-surface-elevated": "--xc-se",
  "--xeg-color-background": "--xc-bg",
  // Colors - Neutral
  "--xeg-color-neutral-100": "--xcn1",
  "--xeg-color-neutral-200": "--xcn2",
  "--xeg-color-neutral-300": "--xcn3",
  "--xeg-color-neutral-400": "--xcn4",
  "--xeg-color-neutral-500": "--xcn5",
  // Spacing
  "--xeg-spacing-xs": "--xs-xs",
  "--xeg-spacing-sm": "--xs-s",
  "--xeg-spacing-md": "--xs-m",
  "--xeg-spacing-lg": "--xs-l",
  "--xeg-spacing-xl": "--xs-xl",
  "--xeg-spacing-2xl": "--xs-2",
  "--xeg-spacing-3xl": "--xs-3",
  "--xeg-spacing-5xl": "--xs-5",
  // Radius
  "--xeg-radius-xs": "--xr-xs",
  "--xeg-radius-sm": "--xr-s",
  "--xeg-radius-md": "--xr-m",
  "--xeg-radius-lg": "--xr-l",
  "--xeg-radius-xl": "--xr-xl",
  "--xeg-radius-2xl": "--xr-2",
  "--xeg-radius-full": "--xr-f",
  // Font
  "--xeg-font-size-sm": "--xfs-s",
  "--xeg-font-size-base": "--xfs-b",
  "--xeg-font-size-md": "--xfs-m",
  "--xeg-font-size-lg": "--xfs-l",
  "--xeg-font-size-2xl": "--xfs-2",
  "--xeg-font-weight-medium": "--xfw-m",
  "--xeg-font-weight-semibold": "--xfw-s",
  "--xeg-font-family-ui": "--xff-u",
  "--xeg-line-height-normal": "--xlh",
  // Z-index
  "--xeg-z-gallery": "--xz-g",
  "--xeg-z-gallery-overlay": "--xz-go",
  "--xeg-z-gallery-toolbar": "--xz-gt",
  "--xeg-z-toolbar": "--xz-t",
  "--xeg-z-toolbar-hover-zone": "--xz-th",
  "--xeg-z-toolbar-panel": "--xz-tp",
  "--xeg-z-toolbar-panel-active": "--xz-ta",
  "--xeg-z-overlay": "--xz-o",
  "--xeg-z-modal": "--xz-m",
  "--xeg-z-modal-backdrop": "--xz-mb",
  "--xeg-z-modal-foreground": "--xz-mf",
  "--xeg-z-tooltip": "--xz-tt",
  "--xeg-z-stack-base": "--xz-sb",
  "--xeg-layer-root": "--xlr",
  // Toolbar
  "--xeg-toolbar-surface": "--xt-s",
  "--xeg-toolbar-border": "--xt-b",
  "--xeg-toolbar-panel-surface": "--xtp-s",
  "--xeg-toolbar-panel-transition": "--xtp-t",
  "--xeg-toolbar-panel-height": "--xtp-h",
  "--xeg-toolbar-panel-max-height": "--xtp-mh",
  "--xeg-toolbar-panel-shadow": "--xtp-sh",
  "--xeg-toolbar-text-color": "--xtt-c",
  "--xeg-toolbar-text-muted": "--xtt-m",
  "--xeg-toolbar-element-bg": "--xte-b",
  "--xeg-toolbar-element-bg-strong": "--xte-bs",
  "--xeg-toolbar-element-border": "--xte-br",
  "--xeg-toolbar-progress-track": "--xtp-pt",
  "--xeg-toolbar-scrollbar-track": "--xts-t",
  "--xeg-toolbar-scrollbar-thumb": "--xts-th",
  "--xeg-toolbar-shadow": "--xt-sh",
  "--xeg-toolbar-hover-zone-bg": "--xth-bg",
  "--xeg-toolbar-hidden-opacity": "--xth-o",
  "--xeg-toolbar-hidden-visibility": "--xth-v",
  "--xeg-toolbar-hidden-pointer-events": "--xth-pe",
  // Button
  "--xeg-button-lift": "--xb-l",
  "--xeg-button-bg": "--xb-bg",
  "--xeg-button-border": "--xb-b",
  "--xeg-button-text": "--xb-t",
  "--xeg-button-bg-hover": "--xb-bgh",
  "--xeg-button-border-hover": "--xb-bh",
  "--xeg-button-disabled-opacity": "--xb-do",
  "--xeg-button-square-size": "--xb-ss",
  "--xeg-button-square-padding": "--xb-sp",
  // Size
  "--xeg-size-button-sm": "--xsb-s",
  "--xeg-size-button-md": "--xsb-m",
  "--xeg-size-button-lg": "--xsb-l",
  // Surface
  "--xeg-surface-bg": "--xsu-b",
  "--xeg-surface-border": "--xsu-br",
  "--xeg-surface-bg-hover": "--xsu-bh",
  // Gallery
  "--xeg-gallery-bg": "--xg-b",
  "--xeg-gallery-bg-light": "--xg-bl",
  "--xeg-gallery-bg-dark": "--xg-bd",
  // Modal
  "--xeg-modal-bg": "--xm-b",
  "--xeg-modal-border": "--xm-br",
  "--xeg-modal-bg-light": "--xm-bl",
  "--xeg-modal-bg-dark": "--xm-bd",
  "--xeg-modal-border-light": "--xm-brl",
  "--xeg-modal-border-dark": "--xm-brd",
  // Spinner
  "--xeg-spinner-size": "--xsp-s",
  "--xeg-spinner-size-default": "--xsp-sd",
  "--xeg-spinner-border-width": "--xsp-bw",
  "--xeg-spinner-track-color": "--xsp-tc",
  "--xeg-spinner-indicator-color": "--xsp-ic",
  "--xeg-spinner-duration": "--xsp-d",
  "--xeg-spinner-easing": "--xsp-e",
  // Misc
  "--xeg-opacity-disabled": "--xo-d",
  "--xeg-hover-lift": "--xhl",
  "--xeg-focus-indicator-color": "--xfic",
  "--xeg-border-emphasis": "--xbe",
  "--xeg-border-button": "--xbb",
  "--xeg-skeleton-bg": "--xsk-b",
  "--xeg-scrollbar-width": "--xsw",
  "--xeg-scrollbar-border-radius": "--xsbr",
  "--xeg-hover-zone-height": "--xhzh",
  "--xeg-icon-size": "--xis",
  "--xeg-icon-stroke-width": "--xisw",
  "--xeg-icon-only-size": "--xios",
  "--xeg-gpu-hack": "--xgh",
  "--xeg-backface-visibility": "--xbv",
  "--xeg-bg-toolbar": "--xbgt",
  "--xeg-glass-border-strong": "--xgbs",
  "--xeg-viewport-height-constrained": "--xvhc",
  "--xeg-aspect-default": "--xad",
  // Settings
  "--xeg-settings-gap": "--xse-g",
  "--xeg-settings-padding": "--xse-p",
  "--xeg-settings-control-gap": "--xse-cg",
  "--xeg-settings-label-font-size": "--xse-lf",
  "--xeg-settings-label-font-weight": "--xse-lw",
  "--xeg-settings-select-font-size": "--xse-sf",
  "--xeg-settings-select-padding": "--xse-sp",
  // Gallery item intrinsic
  "--xeg-gallery-item-intrinsic-width": "--xgi-w",
  "--xeg-gallery-item-intrinsic-height": "--xgi-h",
  "--xeg-gallery-item-intrinsic-ratio": "--xgi-r",
  "--xeg-gallery-fit-height-target": "--xgf-ht"
};
function shortenCssVariables(css) {
  let result = css;
  const sortedEntries = Object.entries(CSS_VAR_SHORTENING_MAP).sort((a, b) => b[0].length - a[0].length);
  for (const [longName, shortName] of sortedEntries) {
    const escapedLong = longName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(escapedLong, "g");
    result = result.replace(regex, shortName);
  }
  return result;
}
function compressCssValues(css) {
  return css.replace(/\b0+\.(\d)/g, ".$1").replace(/\b0(px|rem|em|vh|vw|vmin|vmax|ch|ex)\b/g, "0").replace(/\s*:\s*/g, ":").replace(/\s*;\s*/g, ";").replace(/;}/g, "}").replace(/\s*\{/g, "{").replace(/\{\s*/g, "{").replace(/\s*\}/g, "}").replace(/\s+/g, " ").replace(/\n/g, "").trim();
}
function processCss(css, config) {
  let result = css;
  if (config.cssRemoveComments) {
    result = removeCssComments(result);
  }
  if (config.cssVariableShortening) {
    result = shortenCssVariables(result);
  }
  if (config.cssValueMinify) {
    result = compressCssValues(result);
  }
  return result;
}
function extractCssFromBundle(bundle, config) {
  const cssChunks = [];
  for (const [fileName, asset] of Object.entries(bundle)) {
    if (!fileName.endsWith(".css") || asset.type !== "asset") continue;
    const { source } = asset;
    let cssContent = "";
    if (typeof source === "string") {
      cssContent = source;
    } else if (source instanceof Uint8Array) {
      cssContent = new TextDecoder().decode(source);
    }
    if (cssContent) {
      cssContent = processCss(cssContent, config);
    }
    cssChunks.push(cssContent);
    delete bundle[fileName];
  }
  return cssChunks.join(config.cssCompress ? "" : "\n");
}
function generateCssInjectionCode(css, isDev) {
  return `
(function() {
  'use strict';
  if (typeof document === 'undefined') return;

  var css = ${JSON.stringify(css)};

  var existingStyle = document.getElementById('${STYLE_ID}');
  if (existingStyle) {
    existingStyle.textContent = css;
    return;
  }

  var style = document.createElement('style');
  style.id = '${STYLE_ID}';
  style.setAttribute('data-xeg-version', '${isDev ? "dev" : "prod"}');
  style.textContent = css;

  (document.head || document.documentElement).appendChild(style);
})();
`;
}
function cssInlinePlugin(mode) {
  const isDev = mode === "development";
  const config = getBuildModeConfig(mode);
  return {
    name: "css-inline",
    apply: "build",
    enforce: "post",
    generateBundle(_options, bundle) {
      const cssContent = extractCssFromBundle(
        bundle,
        config
      );
      if (!cssContent.trim()) return;
      for (const chunk of Object.values(bundle)) {
        if (chunk.type === "chunk" && chunk.isEntry) {
          chunk.code = generateCssInjectionCode(cssContent, isDev) + chunk.code;
          break;
        }
      }
    }
  };
}
function removeLogCalls(code, methods) {
  const methodPattern = methods.join("|");
  const regex = new RegExp(
    `logger(?:\\$\\d+)?\\?\\.(?:${methodPattern})\\(|logger(?:\\$\\d+)?\\.(?:${methodPattern})\\(`,
    "g"
  );
  let result = "";
  let lastIndex = 0;
  let match;
  while ((match = regex.exec(code)) !== null) {
    const startIndex = match.index;
    const openParenIndex = startIndex + match[0].length - 1;
    let depth = 1;
    let i = openParenIndex + 1;
    let inString = false;
    let stringChar = "";
    let inTemplate = false;
    let templateDepth = 0;
    while (i < code.length && depth > 0) {
      const char = code[i];
      const prevChar = code[i - 1];
      if (!inString && !inTemplate && (char === '"' || char === "'" || char === "`")) {
        inString = true;
        stringChar = char;
        if (char === "`") {
          inTemplate = true;
          inString = false;
        }
      } else if (inString && char === stringChar && prevChar !== "\\") {
        inString = false;
      } else if (inTemplate) {
        if (char === "`" && prevChar !== "\\") {
          inTemplate = false;
        } else if (char === "$" && code[i + 1] === "{") {
          templateDepth++;
          i++;
        } else if (char === "}" && templateDepth > 0) {
          templateDepth--;
        }
      } else if (!inString && !inTemplate) {
        if (char === "(") depth++;
        else if (char === ")") depth--;
      }
      i++;
    }
    if (depth === 0) {
      result += code.slice(lastIndex, startIndex);
      const beforeLog = result.slice(-20);
      const isArrowFnBody = /=>\s*$/.test(beforeLog);
      if (isArrowFnBody) {
        result += "{}";
      }
      let endIndex = i;
      if (code[endIndex] === ";") endIndex++;
      if (code[endIndex] === "\n") endIndex++;
      lastIndex = endIndex;
      regex.lastIndex = endIndex;
    }
  }
  result += code.slice(lastIndex);
  return result;
}
function productionCleanupPlugin() {
  return {
    name: "production-cleanup",
    apply: "build",
    enforce: "post",
    generateBundle(_options, bundle) {
      for (const chunk of Object.values(bundle)) {
        if (chunk.type !== "chunk") continue;
        let code = chunk.code;
        code = code.replace(
          /const\s+\w+\s*=\s*(?:\/\*#__PURE__\*\/\s*)?Object\.freeze\(\s*(?:\/\*#__PURE__\*\/\s*)?Object\.defineProperty\(\s*\{\s*__proto__\s*:\s*null\s*\}\s*,\s*Symbol\.toStringTag\s*,\s*\{\s*value\s*:\s*['"]Module['"]\s*\}\s*\)\s*\)\s*;?\n?/g,
          ""
        );
        code = code.replace(/\/\*#__PURE__\*\/\s*/g, "");
        code = code.replace(
          /Object\.freeze\(\s*\{\s*__proto__\s*:\s*null\s*\}\s*\)/g,
          "({})"
        );
        code = removeLogCalls(code, ["debug", "info"]);
        code = code.replace(
          /,\s*reset\(\)\s*\{\s*instance\s*=\s*null;\s*\}/g,
          ""
        );
        code = code.replace(
          /static\s+resetForTests\(\)\s*\{[^}]*\}/g,
          ""
        );
        code = code.replace(
          /exports\.[a-zA-Z_$][a-zA-Z0-9_$]*\s*=\s*[^;]+;/g,
          ""
        );
        code = code.replace(
          /Object\.defineProperty\(exports,['"]__esModule['"],\{value:true\}\);?/g,
          ""
        );
        code = code.replace(/\s*\/\*\*\s*@internal[^*]*\*\/\s*/g, "\n");
        code = code.replace(
          /\s*\/\*\*\s*\n\s*\*[^@]*@internal\s*\n\s*\*\/\s*/g,
          "\n"
        );
        code = code.replace(/^[ \t]+$/gm, "");
        code = code.replace(/\n{3,}/g, "\n\n");
        chunk.code = code;
      }
    }
  };
}
function buildPathAliases(root) {
  return Object.fromEntries(
    Object.entries(PATH_ALIASES).map(([alias, path]) => [alias, resolve(root, path)])
  );
}
var vite_config_default = defineConfig(({ mode }) => {
  const isDev = mode === "development";
  const config = getBuildModeConfig(mode);
  const outputFileName = isDev ? OUTPUT_FILE_NAMES.dev : OUTPUT_FILE_NAMES.prod;
  const root = process.cwd();
  return {
    plugins: [
      solidPlugin(),
      cssInlinePlugin(mode),
      // Production: Remove empty module namespace objects and cleanup
      ...!isDev ? [productionCleanupPlugin()] : []
    ],
    root,
    resolve: {
      alias: buildPathAliases(root)
    },
    build: {
      target: "esnext",
      minify: false,
      // Keep readable for Greasy Fork policy
      sourcemap: config.sourceMap,
      outDir: "dist",
      emptyOutDir: false,
      write: true,
      cssCodeSplit: false,
      cssMinify: false,
      lib: {
        entry: resolve(root, "./src/main.ts"),
        name: "XcomEnhancedGallery",
        formats: ["iife"],
        fileName: () => outputFileName.replace(".user.js", ""),
        cssFileName: "style"
      },
      rollupOptions: {
        output: {
          entryFileNames: outputFileName,
          inlineDynamicImports: true,
          exports: "named",
          // Production optimizations
          ...!isDev && {
            // Disable Object.freeze() on module namespace objects
            freeze: false,
            // Use const bindings for better optimization
            generatedCode: {
              symbols: false,
              constBindings: true
            },
            // Remove unnecessary whitespace (not obfuscation)
            compact: true
          }
        },
        // Tree-shake more aggressively in production
        treeshake: isDev ? false : {
          moduleSideEffects: false,
          propertyReadSideEffects: false,
          tryCatchDeoptimization: false,
          unknownGlobalSideEffects: false
        }
      }
    },
    css: {
      modules: {
        generateScopedName: config.cssClassNamePattern,
        localsConvention: "camelCaseOnly",
        scopeBehaviour: "local"
      },
      devSourcemap: isDev
    },
    define: {
      __DEV__: JSON.stringify(isDev),
      "import.meta.env.MODE": JSON.stringify(mode),
      "import.meta.env.DEV": JSON.stringify(isDev),
      "import.meta.env.PROD": JSON.stringify(!isDev)
    },
    logLevel: "warn"
  };
});
export {
  BUILD_MODE_CONFIGS,
  cssInlinePlugin,
  vite_config_default as default,
  getBuildModeConfig
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlUm9vdCI6ICIvaG9tZS9waWVzcC9wcm9qZWN0cy94Y29tLWVuaGFuY2VkLWdhbGxlcnkvIiwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9waWVzcC9wcm9qZWN0cy94Y29tLWVuaGFuY2VkLWdhbGxlcnlcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9ob21lL3BpZXNwL3Byb2plY3RzL3hjb20tZW5oYW5jZWQtZ2FsbGVyeS92aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vaG9tZS9waWVzcC9wcm9qZWN0cy94Y29tLWVuaGFuY2VkLWdhbGxlcnkvdml0ZS5jb25maWcudHNcIjsvKipcbiAqIFZpdGUgQ29uZmlndXJhdGlvbiBmb3IgWC5jb20gRW5oYW5jZWQgR2FsbGVyeSBVc2Vyc2NyaXB0XG4gKlxuICogVGhpcyBjb25maWd1cmF0aW9uIHN1cHBvcnRzIGJvdGggZGV2ZWxvcG1lbnQgYW5kIHByb2R1Y3Rpb24gYnVpbGRzIHdpdGhcbiAqIGRpZmZlcmVudCBvcHRpbWl6YXRpb24gc3RyYXRlZ2llczpcbiAqXG4gKiBEZXZlbG9wbWVudDogT3B0aW1pemVkIGZvciBkZWJ1Z2dpbmcgYW5kIGFuYWx5c2lzXG4gKiAtIFJlYWRhYmxlIENTUyBjbGFzcyBuYW1lcyAoQ29tcG9uZW50X19jbGFzc05hbWVfX2hhc2gpXG4gKiAtIENTUyBmb3JtYXR0aW5nIHByZXNlcnZlZFxuICogLSBTb3VyY2UgbWFwcyBlbmFibGVkXG4gKlxuICogUHJvZHVjdGlvbjogT3B0aW1pemVkIGZvciBkaXN0cmlidXRpb24gc2l6ZVxuICogLSBIYXNoZWQgQ1NTIGNsYXNzIG5hbWVzICh4ZWdfaGFzaClcbiAqIC0gQ1NTIGZ1bGx5IGNvbXByZXNzZWRcbiAqIC0gTm8gc291cmNlIG1hcHNcbiAqXG4gKiBAc2VlIHNjcmlwdHMvYnVpbGQudHMgZm9yIHRoZSBidWlsZCBvcmNoZXN0cmF0aW9uXG4gKi9cblxuaW1wb3J0IHsgcmVzb2x2ZSB9IGZyb20gXCJub2RlOnBhdGhcIjtcbmltcG9ydCB7IGRlZmluZUNvbmZpZywgdHlwZSBQbHVnaW4sIHR5cGUgVXNlckNvbmZpZyB9IGZyb20gXCJ2aXRlXCI7XG5pbXBvcnQgc29saWRQbHVnaW4gZnJvbSBcInZpdGUtcGx1Z2luLXNvbGlkXCI7XG5cbi8vIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuLy8gQ29uc3RhbnRzXG4vLyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcblxuY29uc3QgU1RZTEVfSUQgPSBcInhlZy1pbmplY3RlZC1zdHlsZXNcIiBhcyBjb25zdDtcblxuY29uc3QgT1VUUFVUX0ZJTEVfTkFNRVMgPSB7XG4gIGRldjogXCJ4Y29tLWVuaGFuY2VkLWdhbGxlcnkuZGV2LnVzZXIuanNcIixcbiAgcHJvZDogXCJ4Y29tLWVuaGFuY2VkLWdhbGxlcnkudXNlci5qc1wiLFxufSBhcyBjb25zdDtcblxuLy8gUGF0aCBhbGlhc2VzIChzaGFyZWQgYmV0d2VlbiBWaXRlIGFuZCBUeXBlU2NyaXB0KVxuY29uc3QgUEFUSF9BTElBU0VTID0ge1xuICBcIkBcIjogXCJzcmNcIixcbiAgXCJAYm9vdHN0cmFwXCI6IFwic3JjL2Jvb3RzdHJhcFwiLFxuICBcIkBjb25zdGFudHNcIjogXCJzcmMvY29uc3RhbnRzXCIsXG4gIFwiQGZlYXR1cmVzXCI6IFwic3JjL2ZlYXR1cmVzXCIsXG4gIFwiQHNoYXJlZFwiOiBcInNyYy9zaGFyZWRcIixcbiAgXCJAc3R5bGVzXCI6IFwic3JjL3N0eWxlc1wiLFxuICBcIkB0eXBlc1wiOiBcInNyYy90eXBlc1wiLFxufSBhcyBjb25zdDtcblxuLy8gXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG4vLyBCdWlsZCBNb2RlIENvbmZpZ3VyYXRpb25cbi8vIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG4vKipcbiAqIEJ1aWxkIG1vZGUgY29uZmlndXJhdGlvbiBpbnRlcmZhY2VcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBCdWlsZE1vZGVDb25maWcge1xuICByZWFkb25seSBjc3NDb21wcmVzczogYm9vbGVhbjtcbiAgcmVhZG9ubHkgY3NzUmVtb3ZlQ29tbWVudHM6IGJvb2xlYW47XG4gIHJlYWRvbmx5IGNzc1ZhcmlhYmxlU2hvcnRlbmluZzogYm9vbGVhbjtcbiAgcmVhZG9ubHkgY3NzVmFsdWVNaW5pZnk6IGJvb2xlYW47XG4gIHJlYWRvbmx5IGNzc0NsYXNzTmFtZVBhdHRlcm46IHN0cmluZztcbiAgcmVhZG9ubHkgc291cmNlTWFwOiBib29sZWFuIHwgXCJpbmxpbmVcIjtcbiAgcmVhZG9ubHkgb3V0cHV0U3VmZml4OiBzdHJpbmc7XG59XG5cbi8qKlxuICogQnVpbGQgbW9kZSBjb25maWd1cmF0aW9ucyBmb3IgZGV2ZWxvcG1lbnQgYW5kIHByb2R1Y3Rpb25cbiAqL1xuZXhwb3J0IGNvbnN0IEJVSUxEX01PREVfQ09ORklHUyA9IHtcbiAgZGV2ZWxvcG1lbnQ6IHtcbiAgICBjc3NDb21wcmVzczogZmFsc2UsXG4gICAgY3NzUmVtb3ZlQ29tbWVudHM6IGZhbHNlLFxuICAgIGNzc1ZhcmlhYmxlU2hvcnRlbmluZzogZmFsc2UsXG4gICAgY3NzVmFsdWVNaW5pZnk6IGZhbHNlLFxuICAgIGNzc0NsYXNzTmFtZVBhdHRlcm46IFwiW25hbWVdX19bbG9jYWxdX19baGFzaDpiYXNlNjQ6NV1cIixcbiAgICBzb3VyY2VNYXA6IFwiaW5saW5lXCIgYXMgY29uc3QsXG4gICAgb3V0cHV0U3VmZml4OiBcIi5kZXZcIixcbiAgfSxcbiAgcHJvZHVjdGlvbjoge1xuICAgIGNzc0NvbXByZXNzOiB0cnVlLFxuICAgIGNzc1JlbW92ZUNvbW1lbnRzOiB0cnVlLFxuICAgIGNzc1ZhcmlhYmxlU2hvcnRlbmluZzogdHJ1ZSxcbiAgICBjc3NWYWx1ZU1pbmlmeTogdHJ1ZSxcbiAgICBjc3NDbGFzc05hbWVQYXR0ZXJuOiBcInhlZ19baGFzaDpiYXNlNjQ6Nl1cIixcbiAgICBzb3VyY2VNYXA6IGZhbHNlIGFzIGNvbnN0LFxuICAgIG91dHB1dFN1ZmZpeDogXCJcIixcbiAgfSxcbn0gc2F0aXNmaWVzIFJlY29yZDxcImRldmVsb3BtZW50XCIgfCBcInByb2R1Y3Rpb25cIiwgQnVpbGRNb2RlQ29uZmlnPjtcblxuLyoqIEdldCBidWlsZCBtb2RlIGNvbmZpZyBiYXNlZCBvbiBtb2RlIHN0cmluZyAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldEJ1aWxkTW9kZUNvbmZpZyhtb2RlOiBzdHJpbmcpOiBCdWlsZE1vZGVDb25maWcge1xuICByZXR1cm4gQlVJTERfTU9ERV9DT05GSUdTW1xuICAgIG1vZGUgPT09IFwiZGV2ZWxvcG1lbnRcIiA/IFwiZGV2ZWxvcG1lbnRcIiA6IFwicHJvZHVjdGlvblwiXG4gIF07XG59XG5cbi8vIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuLy8gQ1NTIFByb2Nlc3NpbmcgVXRpbGl0aWVzXG4vLyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcblxuLyoqXG4gKiBSZW1vdmUgQ1NTIGNvbW1lbnRzIChwcmVzZXJ2ZXMgc3RydWN0dXJlKVxuICovXG5mdW5jdGlvbiByZW1vdmVDc3NDb21tZW50cyhjc3M6IHN0cmluZyk6IHN0cmluZyB7XG4gIGxldCByZXN1bHQgPSBcIlwiO1xuICBsZXQgaSA9IDA7XG4gIGxldCBpblN0cmluZyA9IGZhbHNlO1xuICBsZXQgc3RyaW5nQ2hhciA9IFwiXCI7XG5cbiAgd2hpbGUgKGkgPCBjc3MubGVuZ3RoKSB7XG4gICAgaWYgKCFpblN0cmluZyAmJiAoY3NzW2ldID09PSAnXCInIHx8IGNzc1tpXSA9PT0gXCInXCIpKSB7XG4gICAgICBpblN0cmluZyA9IHRydWU7XG4gICAgICBzdHJpbmdDaGFyID0gY3NzW2ldO1xuICAgICAgcmVzdWx0ICs9IGNzc1tpXTtcbiAgICAgIGkrKztcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmIChpblN0cmluZykge1xuICAgICAgaWYgKGNzc1tpXSA9PT0gc3RyaW5nQ2hhciAmJiBjc3NbaSAtIDFdICE9PSBcIlxcXFxcIikge1xuICAgICAgICBpblN0cmluZyA9IGZhbHNlO1xuICAgICAgfVxuICAgICAgcmVzdWx0ICs9IGNzc1tpXTtcbiAgICAgIGkrKztcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmIChjc3NbaV0gPT09IFwiL1wiICYmIGNzc1tpICsgMV0gPT09IFwiKlwiKSB7XG4gICAgICBjb25zdCBjb21tZW50RW5kID0gY3NzLmluZGV4T2YoXCIqL1wiLCBpICsgMik7XG4gICAgICBpZiAoY29tbWVudEVuZCA9PT0gLTEpIGJyZWFrO1xuICAgICAgaSA9IGNvbW1lbnRFbmQgKyAyO1xuICAgICAgaWYgKFxuICAgICAgICByZXN1bHQubGVuZ3RoID4gMCAmJiByZXN1bHRbcmVzdWx0Lmxlbmd0aCAtIDFdICE9PSBcIiBcIiAmJlxuICAgICAgICByZXN1bHRbcmVzdWx0Lmxlbmd0aCAtIDFdICE9PSBcIlxcblwiXG4gICAgICApIHtcbiAgICAgICAgcmVzdWx0ICs9IFwiIFwiO1xuICAgICAgfVxuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgcmVzdWx0ICs9IGNzc1tpXTtcbiAgICBpKys7XG4gIH1cblxuICByZXR1cm4gcmVzdWx0XG4gICAgLnJlcGxhY2UoLyAgKy9nLCBcIiBcIilcbiAgICAucmVwbGFjZSgvXFxuXFxzKlxcbi9nLCBcIlxcblwiKVxuICAgIC5yZXBsYWNlKC9eXFxzKy9nbSwgXCJcIilcbiAgICAucmVwbGFjZSgvXFxzKyQvZ20sIFwiXCIpXG4gICAgLnRyaW0oKTtcbn1cblxuLyoqXG4gKiBDU1MgdmFyaWFibGUgc2hvcnRlbmluZyBtYXAgZm9yIHByb2R1Y3Rpb24gYnVpbGRzXG4gKiBNYXBzIHZlcmJvc2UgLS14ZWctKiB2YXJpYWJsZSBuYW1lcyB0byBzaG9ydCBhbHRlcm5hdGl2ZXNcbiAqL1xuY29uc3QgQ1NTX1ZBUl9TSE9SVEVOSU5HX01BUDogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHtcbiAgLy8gRWFzaW5nL0FuaW1hdGlvblxuICBcIi0teGVnLWVhc2Utc3RhbmRhcmRcIjogXCItLXhlLXNcIixcbiAgXCItLXhlZy1lYXNlLWRlY2VsZXJhdGVcIjogXCItLXhlLWRcIixcbiAgXCItLXhlZy1lYXNlLWFjY2VsZXJhdGVcIjogXCItLXhlLWFcIixcbiAgXCItLXhlZy1lYXNlLWVudHJhbmNlXCI6IFwiLS14ZS1lXCIsXG4gIFwiLS14ZWctZWFzaW5nLWVhc2Utb3V0XCI6IFwiLS14ZW9cIixcbiAgXCItLXhlZy1lYXNpbmctZWFzZS1pblwiOiBcIi0teGVpXCIsXG4gIFwiLS14ZWctZWFzaW5nLWxpbmVhclwiOiBcIi0teGVsXCIsXG5cbiAgLy8gRHVyYXRpb25cbiAgXCItLXhlZy1kdXJhdGlvblwiOiBcIi0teGRcIixcbiAgXCItLXhlZy1kdXJhdGlvbi1mYXN0XCI6IFwiLS14ZGZcIixcbiAgXCItLXhlZy1kdXJhdGlvbi1ub3JtYWxcIjogXCItLXhkblwiLFxuICBcIi0teGVnLWR1cmF0aW9uLXNsb3dcIjogXCItLXhkc1wiLFxuICBcIi0teGVnLWR1cmF0aW9uLXRvb2xiYXJcIjogXCItLXhkdFwiLFxuXG4gIC8vIFRyYW5zaXRpb25zXG4gIFwiLS14ZWctdHJhbnNpdGlvbi1pbnRlcmFjdGlvbi1mYXN0XCI6IFwiLS14dGlcIixcbiAgXCItLXhlZy10cmFuc2l0aW9uLXN1cmZhY2UtZmFzdFwiOiBcIi0teHRzXCIsXG4gIFwiLS14ZWctdHJhbnNpdGlvbi1zdXJmYWNlLW5vcm1hbFwiOiBcIi0teHRzblwiLFxuICBcIi0teGVnLXRyYW5zaXRpb24tZWxldmF0aW9uLWZhc3RcIjogXCItLXh0ZWZcIixcbiAgXCItLXhlZy10cmFuc2l0aW9uLWVsZXZhdGlvbi1ub3JtYWxcIjogXCItLXh0ZW5cIixcbiAgXCItLXhlZy10cmFuc2l0aW9uLXdpZHRoLW5vcm1hbFwiOiBcIi0teHR3blwiLFxuICBcIi0teGVnLXRyYW5zaXRpb24tb3BhY2l0eVwiOiBcIi0teHRvXCIsXG4gIFwiLS14ZWctdHJhbnNpdGlvbi10b29sYmFyXCI6IFwiLS14dHRcIixcblxuICAvLyBDb2xvcnMgLSBUZXh0XG4gIFwiLS14ZWctY29sb3ItdGV4dC1wcmltYXJ5XCI6IFwiLS14Y3QtcFwiLFxuICBcIi0teGVnLWNvbG9yLXRleHQtc2Vjb25kYXJ5XCI6IFwiLS14Y3Qtc1wiLFxuICBcIi0teGVnLWNvbG9yLXRleHQtdGVydGlhcnlcIjogXCItLXhjdC10XCIsXG4gIFwiLS14ZWctY29sb3ItdGV4dC1pbnZlcnNlXCI6IFwiLS14Y3QtaVwiLFxuXG4gIC8vIENvbG9ycyAtIEJvcmRlclxuICBcIi0teGVnLWNvbG9yLWJvcmRlci1wcmltYXJ5XCI6IFwiLS14Y2ItcFwiLFxuICBcIi0teGVnLWNvbG9yLWJvcmRlci1ob3ZlclwiOiBcIi0teGNiLWhcIixcbiAgXCItLXhlZy1jb2xvci1ib3JkZXItc3Ryb25nXCI6IFwiLS14Y2Itc1wiLFxuXG4gIC8vIENvbG9ycyAtIEJhY2tncm91bmRcbiAgXCItLXhlZy1jb2xvci1iZy1wcmltYXJ5XCI6IFwiLS14Y2JnLXBcIixcbiAgXCItLXhlZy1jb2xvci1iZy1zZWNvbmRhcnlcIjogXCItLXhjYmctc1wiLFxuXG4gIC8vIENvbG9ycyAtIFNlbWFudGljXG4gIFwiLS14ZWctY29sb3ItcHJpbWFyeVwiOiBcIi0teGMtcFwiLFxuICBcIi0teGVnLWNvbG9yLXByaW1hcnktaG92ZXJcIjogXCItLXhjLXBoXCIsXG4gIFwiLS14ZWctY29sb3Itc3VjY2Vzc1wiOiBcIi0teGMtc1wiLFxuICBcIi0teGVnLWNvbG9yLXN1Y2Nlc3MtaG92ZXJcIjogXCItLXhjLXNoXCIsXG4gIFwiLS14ZWctY29sb3ItZXJyb3JcIjogXCItLXhjLWVcIixcbiAgXCItLXhlZy1jb2xvci1lcnJvci1ob3ZlclwiOiBcIi0teGMtZWhcIixcbiAgXCItLXhlZy1jb2xvci1vdmVybGF5LW1lZGl1bVwiOiBcIi0teGMtb21cIixcbiAgXCItLXhlZy1jb2xvci1zdXJmYWNlLWVsZXZhdGVkXCI6IFwiLS14Yy1zZVwiLFxuICBcIi0teGVnLWNvbG9yLWJhY2tncm91bmRcIjogXCItLXhjLWJnXCIsXG5cbiAgLy8gQ29sb3JzIC0gTmV1dHJhbFxuICBcIi0teGVnLWNvbG9yLW5ldXRyYWwtMTAwXCI6IFwiLS14Y24xXCIsXG4gIFwiLS14ZWctY29sb3ItbmV1dHJhbC0yMDBcIjogXCItLXhjbjJcIixcbiAgXCItLXhlZy1jb2xvci1uZXV0cmFsLTMwMFwiOiBcIi0teGNuM1wiLFxuICBcIi0teGVnLWNvbG9yLW5ldXRyYWwtNDAwXCI6IFwiLS14Y240XCIsXG4gIFwiLS14ZWctY29sb3ItbmV1dHJhbC01MDBcIjogXCItLXhjbjVcIixcblxuICAvLyBTcGFjaW5nXG4gIFwiLS14ZWctc3BhY2luZy14c1wiOiBcIi0teHMteHNcIixcbiAgXCItLXhlZy1zcGFjaW5nLXNtXCI6IFwiLS14cy1zXCIsXG4gIFwiLS14ZWctc3BhY2luZy1tZFwiOiBcIi0teHMtbVwiLFxuICBcIi0teGVnLXNwYWNpbmctbGdcIjogXCItLXhzLWxcIixcbiAgXCItLXhlZy1zcGFjaW5nLXhsXCI6IFwiLS14cy14bFwiLFxuICBcIi0teGVnLXNwYWNpbmctMnhsXCI6IFwiLS14cy0yXCIsXG4gIFwiLS14ZWctc3BhY2luZy0zeGxcIjogXCItLXhzLTNcIixcbiAgXCItLXhlZy1zcGFjaW5nLTV4bFwiOiBcIi0teHMtNVwiLFxuXG4gIC8vIFJhZGl1c1xuICBcIi0teGVnLXJhZGl1cy14c1wiOiBcIi0teHIteHNcIixcbiAgXCItLXhlZy1yYWRpdXMtc21cIjogXCItLXhyLXNcIixcbiAgXCItLXhlZy1yYWRpdXMtbWRcIjogXCItLXhyLW1cIixcbiAgXCItLXhlZy1yYWRpdXMtbGdcIjogXCItLXhyLWxcIixcbiAgXCItLXhlZy1yYWRpdXMteGxcIjogXCItLXhyLXhsXCIsXG4gIFwiLS14ZWctcmFkaXVzLTJ4bFwiOiBcIi0teHItMlwiLFxuICBcIi0teGVnLXJhZGl1cy1mdWxsXCI6IFwiLS14ci1mXCIsXG5cbiAgLy8gRm9udFxuICBcIi0teGVnLWZvbnQtc2l6ZS1zbVwiOiBcIi0teGZzLXNcIixcbiAgXCItLXhlZy1mb250LXNpemUtYmFzZVwiOiBcIi0teGZzLWJcIixcbiAgXCItLXhlZy1mb250LXNpemUtbWRcIjogXCItLXhmcy1tXCIsXG4gIFwiLS14ZWctZm9udC1zaXplLWxnXCI6IFwiLS14ZnMtbFwiLFxuICBcIi0teGVnLWZvbnQtc2l6ZS0yeGxcIjogXCItLXhmcy0yXCIsXG4gIFwiLS14ZWctZm9udC13ZWlnaHQtbWVkaXVtXCI6IFwiLS14ZnctbVwiLFxuICBcIi0teGVnLWZvbnQtd2VpZ2h0LXNlbWlib2xkXCI6IFwiLS14Znctc1wiLFxuICBcIi0teGVnLWZvbnQtZmFtaWx5LXVpXCI6IFwiLS14ZmYtdVwiLFxuICBcIi0teGVnLWxpbmUtaGVpZ2h0LW5vcm1hbFwiOiBcIi0teGxoXCIsXG5cbiAgLy8gWi1pbmRleFxuICBcIi0teGVnLXotZ2FsbGVyeVwiOiBcIi0teHotZ1wiLFxuICBcIi0teGVnLXotZ2FsbGVyeS1vdmVybGF5XCI6IFwiLS14ei1nb1wiLFxuICBcIi0teGVnLXotZ2FsbGVyeS10b29sYmFyXCI6IFwiLS14ei1ndFwiLFxuICBcIi0teGVnLXotdG9vbGJhclwiOiBcIi0teHotdFwiLFxuICBcIi0teGVnLXotdG9vbGJhci1ob3Zlci16b25lXCI6IFwiLS14ei10aFwiLFxuICBcIi0teGVnLXotdG9vbGJhci1wYW5lbFwiOiBcIi0teHotdHBcIixcbiAgXCItLXhlZy16LXRvb2xiYXItcGFuZWwtYWN0aXZlXCI6IFwiLS14ei10YVwiLFxuICBcIi0teGVnLXotb3ZlcmxheVwiOiBcIi0teHotb1wiLFxuICBcIi0teGVnLXotbW9kYWxcIjogXCItLXh6LW1cIixcbiAgXCItLXhlZy16LW1vZGFsLWJhY2tkcm9wXCI6IFwiLS14ei1tYlwiLFxuICBcIi0teGVnLXotbW9kYWwtZm9yZWdyb3VuZFwiOiBcIi0teHotbWZcIixcbiAgXCItLXhlZy16LXRvb2x0aXBcIjogXCItLXh6LXR0XCIsXG4gIFwiLS14ZWctei1zdGFjay1iYXNlXCI6IFwiLS14ei1zYlwiLFxuICBcIi0teGVnLWxheWVyLXJvb3RcIjogXCItLXhsclwiLFxuXG4gIC8vIFRvb2xiYXJcbiAgXCItLXhlZy10b29sYmFyLXN1cmZhY2VcIjogXCItLXh0LXNcIixcbiAgXCItLXhlZy10b29sYmFyLWJvcmRlclwiOiBcIi0teHQtYlwiLFxuICBcIi0teGVnLXRvb2xiYXItcGFuZWwtc3VyZmFjZVwiOiBcIi0teHRwLXNcIixcbiAgXCItLXhlZy10b29sYmFyLXBhbmVsLXRyYW5zaXRpb25cIjogXCItLXh0cC10XCIsXG4gIFwiLS14ZWctdG9vbGJhci1wYW5lbC1oZWlnaHRcIjogXCItLXh0cC1oXCIsXG4gIFwiLS14ZWctdG9vbGJhci1wYW5lbC1tYXgtaGVpZ2h0XCI6IFwiLS14dHAtbWhcIixcbiAgXCItLXhlZy10b29sYmFyLXBhbmVsLXNoYWRvd1wiOiBcIi0teHRwLXNoXCIsXG4gIFwiLS14ZWctdG9vbGJhci10ZXh0LWNvbG9yXCI6IFwiLS14dHQtY1wiLFxuICBcIi0teGVnLXRvb2xiYXItdGV4dC1tdXRlZFwiOiBcIi0teHR0LW1cIixcbiAgXCItLXhlZy10b29sYmFyLWVsZW1lbnQtYmdcIjogXCItLXh0ZS1iXCIsXG4gIFwiLS14ZWctdG9vbGJhci1lbGVtZW50LWJnLXN0cm9uZ1wiOiBcIi0teHRlLWJzXCIsXG4gIFwiLS14ZWctdG9vbGJhci1lbGVtZW50LWJvcmRlclwiOiBcIi0teHRlLWJyXCIsXG4gIFwiLS14ZWctdG9vbGJhci1wcm9ncmVzcy10cmFja1wiOiBcIi0teHRwLXB0XCIsXG4gIFwiLS14ZWctdG9vbGJhci1zY3JvbGxiYXItdHJhY2tcIjogXCItLXh0cy10XCIsXG4gIFwiLS14ZWctdG9vbGJhci1zY3JvbGxiYXItdGh1bWJcIjogXCItLXh0cy10aFwiLFxuICBcIi0teGVnLXRvb2xiYXItc2hhZG93XCI6IFwiLS14dC1zaFwiLFxuICBcIi0teGVnLXRvb2xiYXItaG92ZXItem9uZS1iZ1wiOiBcIi0teHRoLWJnXCIsXG4gIFwiLS14ZWctdG9vbGJhci1oaWRkZW4tb3BhY2l0eVwiOiBcIi0teHRoLW9cIixcbiAgXCItLXhlZy10b29sYmFyLWhpZGRlbi12aXNpYmlsaXR5XCI6IFwiLS14dGgtdlwiLFxuICBcIi0teGVnLXRvb2xiYXItaGlkZGVuLXBvaW50ZXItZXZlbnRzXCI6IFwiLS14dGgtcGVcIixcblxuICAvLyBCdXR0b25cbiAgXCItLXhlZy1idXR0b24tbGlmdFwiOiBcIi0teGItbFwiLFxuICBcIi0teGVnLWJ1dHRvbi1iZ1wiOiBcIi0teGItYmdcIixcbiAgXCItLXhlZy1idXR0b24tYm9yZGVyXCI6IFwiLS14Yi1iXCIsXG4gIFwiLS14ZWctYnV0dG9uLXRleHRcIjogXCItLXhiLXRcIixcbiAgXCItLXhlZy1idXR0b24tYmctaG92ZXJcIjogXCItLXhiLWJnaFwiLFxuICBcIi0teGVnLWJ1dHRvbi1ib3JkZXItaG92ZXJcIjogXCItLXhiLWJoXCIsXG4gIFwiLS14ZWctYnV0dG9uLWRpc2FibGVkLW9wYWNpdHlcIjogXCItLXhiLWRvXCIsXG4gIFwiLS14ZWctYnV0dG9uLXNxdWFyZS1zaXplXCI6IFwiLS14Yi1zc1wiLFxuICBcIi0teGVnLWJ1dHRvbi1zcXVhcmUtcGFkZGluZ1wiOiBcIi0teGItc3BcIixcblxuICAvLyBTaXplXG4gIFwiLS14ZWctc2l6ZS1idXR0b24tc21cIjogXCItLXhzYi1zXCIsXG4gIFwiLS14ZWctc2l6ZS1idXR0b24tbWRcIjogXCItLXhzYi1tXCIsXG4gIFwiLS14ZWctc2l6ZS1idXR0b24tbGdcIjogXCItLXhzYi1sXCIsXG5cbiAgLy8gU3VyZmFjZVxuICBcIi0teGVnLXN1cmZhY2UtYmdcIjogXCItLXhzdS1iXCIsXG4gIFwiLS14ZWctc3VyZmFjZS1ib3JkZXJcIjogXCItLXhzdS1iclwiLFxuICBcIi0teGVnLXN1cmZhY2UtYmctaG92ZXJcIjogXCItLXhzdS1iaFwiLFxuXG4gIC8vIEdhbGxlcnlcbiAgXCItLXhlZy1nYWxsZXJ5LWJnXCI6IFwiLS14Zy1iXCIsXG4gIFwiLS14ZWctZ2FsbGVyeS1iZy1saWdodFwiOiBcIi0teGctYmxcIixcbiAgXCItLXhlZy1nYWxsZXJ5LWJnLWRhcmtcIjogXCItLXhnLWJkXCIsXG5cbiAgLy8gTW9kYWxcbiAgXCItLXhlZy1tb2RhbC1iZ1wiOiBcIi0teG0tYlwiLFxuICBcIi0teGVnLW1vZGFsLWJvcmRlclwiOiBcIi0teG0tYnJcIixcbiAgXCItLXhlZy1tb2RhbC1iZy1saWdodFwiOiBcIi0teG0tYmxcIixcbiAgXCItLXhlZy1tb2RhbC1iZy1kYXJrXCI6IFwiLS14bS1iZFwiLFxuICBcIi0teGVnLW1vZGFsLWJvcmRlci1saWdodFwiOiBcIi0teG0tYnJsXCIsXG4gIFwiLS14ZWctbW9kYWwtYm9yZGVyLWRhcmtcIjogXCItLXhtLWJyZFwiLFxuXG4gIC8vIFNwaW5uZXJcbiAgXCItLXhlZy1zcGlubmVyLXNpemVcIjogXCItLXhzcC1zXCIsXG4gIFwiLS14ZWctc3Bpbm5lci1zaXplLWRlZmF1bHRcIjogXCItLXhzcC1zZFwiLFxuICBcIi0teGVnLXNwaW5uZXItYm9yZGVyLXdpZHRoXCI6IFwiLS14c3AtYndcIixcbiAgXCItLXhlZy1zcGlubmVyLXRyYWNrLWNvbG9yXCI6IFwiLS14c3AtdGNcIixcbiAgXCItLXhlZy1zcGlubmVyLWluZGljYXRvci1jb2xvclwiOiBcIi0teHNwLWljXCIsXG4gIFwiLS14ZWctc3Bpbm5lci1kdXJhdGlvblwiOiBcIi0teHNwLWRcIixcbiAgXCItLXhlZy1zcGlubmVyLWVhc2luZ1wiOiBcIi0teHNwLWVcIixcblxuICAvLyBNaXNjXG4gIFwiLS14ZWctb3BhY2l0eS1kaXNhYmxlZFwiOiBcIi0teG8tZFwiLFxuICBcIi0teGVnLWhvdmVyLWxpZnRcIjogXCItLXhobFwiLFxuICBcIi0teGVnLWZvY3VzLWluZGljYXRvci1jb2xvclwiOiBcIi0teGZpY1wiLFxuICBcIi0teGVnLWJvcmRlci1lbXBoYXNpc1wiOiBcIi0teGJlXCIsXG4gIFwiLS14ZWctYm9yZGVyLWJ1dHRvblwiOiBcIi0teGJiXCIsXG4gIFwiLS14ZWctc2tlbGV0b24tYmdcIjogXCItLXhzay1iXCIsXG4gIFwiLS14ZWctc2Nyb2xsYmFyLXdpZHRoXCI6IFwiLS14c3dcIixcbiAgXCItLXhlZy1zY3JvbGxiYXItYm9yZGVyLXJhZGl1c1wiOiBcIi0teHNiclwiLFxuICBcIi0teGVnLWhvdmVyLXpvbmUtaGVpZ2h0XCI6IFwiLS14aHpoXCIsXG4gIFwiLS14ZWctaWNvbi1zaXplXCI6IFwiLS14aXNcIixcbiAgXCItLXhlZy1pY29uLXN0cm9rZS13aWR0aFwiOiBcIi0teGlzd1wiLFxuICBcIi0teGVnLWljb24tb25seS1zaXplXCI6IFwiLS14aW9zXCIsXG4gIFwiLS14ZWctZ3B1LWhhY2tcIjogXCItLXhnaFwiLFxuICBcIi0teGVnLWJhY2tmYWNlLXZpc2liaWxpdHlcIjogXCItLXhidlwiLFxuICBcIi0teGVnLWJnLXRvb2xiYXJcIjogXCItLXhiZ3RcIixcbiAgXCItLXhlZy1nbGFzcy1ib3JkZXItc3Ryb25nXCI6IFwiLS14Z2JzXCIsXG4gIFwiLS14ZWctdmlld3BvcnQtaGVpZ2h0LWNvbnN0cmFpbmVkXCI6IFwiLS14dmhjXCIsXG4gIFwiLS14ZWctYXNwZWN0LWRlZmF1bHRcIjogXCItLXhhZFwiLFxuXG4gIC8vIFNldHRpbmdzXG4gIFwiLS14ZWctc2V0dGluZ3MtZ2FwXCI6IFwiLS14c2UtZ1wiLFxuICBcIi0teGVnLXNldHRpbmdzLXBhZGRpbmdcIjogXCItLXhzZS1wXCIsXG4gIFwiLS14ZWctc2V0dGluZ3MtY29udHJvbC1nYXBcIjogXCItLXhzZS1jZ1wiLFxuICBcIi0teGVnLXNldHRpbmdzLWxhYmVsLWZvbnQtc2l6ZVwiOiBcIi0teHNlLWxmXCIsXG4gIFwiLS14ZWctc2V0dGluZ3MtbGFiZWwtZm9udC13ZWlnaHRcIjogXCItLXhzZS1sd1wiLFxuICBcIi0teGVnLXNldHRpbmdzLXNlbGVjdC1mb250LXNpemVcIjogXCItLXhzZS1zZlwiLFxuICBcIi0teGVnLXNldHRpbmdzLXNlbGVjdC1wYWRkaW5nXCI6IFwiLS14c2Utc3BcIixcblxuICAvLyBHYWxsZXJ5IGl0ZW0gaW50cmluc2ljXG4gIFwiLS14ZWctZ2FsbGVyeS1pdGVtLWludHJpbnNpYy13aWR0aFwiOiBcIi0teGdpLXdcIixcbiAgXCItLXhlZy1nYWxsZXJ5LWl0ZW0taW50cmluc2ljLWhlaWdodFwiOiBcIi0teGdpLWhcIixcbiAgXCItLXhlZy1nYWxsZXJ5LWl0ZW0taW50cmluc2ljLXJhdGlvXCI6IFwiLS14Z2ktclwiLFxuICBcIi0teGVnLWdhbGxlcnktZml0LWhlaWdodC10YXJnZXRcIjogXCItLXhnZi1odFwiLFxufTtcblxuLyoqXG4gKiBTaG9ydGVuIENTUyB2YXJpYWJsZSBuYW1lc1xuICovXG5mdW5jdGlvbiBzaG9ydGVuQ3NzVmFyaWFibGVzKGNzczogc3RyaW5nKTogc3RyaW5nIHtcbiAgbGV0IHJlc3VsdCA9IGNzcztcbiAgY29uc3Qgc29ydGVkRW50cmllcyA9IE9iamVjdC5lbnRyaWVzKENTU19WQVJfU0hPUlRFTklOR19NQVApXG4gICAgLnNvcnQoKGEsIGIpID0+IGJbMF0ubGVuZ3RoIC0gYVswXS5sZW5ndGgpO1xuXG4gIGZvciAoY29uc3QgW2xvbmdOYW1lLCBzaG9ydE5hbWVdIG9mIHNvcnRlZEVudHJpZXMpIHtcbiAgICBjb25zdCBlc2NhcGVkTG9uZyA9IGxvbmdOYW1lLnJlcGxhY2UoL1suKis/XiR7fSgpfFtcXF1cXFxcXS9nLCBcIlxcXFwkJlwiKTtcbiAgICBjb25zdCByZWdleCA9IG5ldyBSZWdFeHAoZXNjYXBlZExvbmcsIFwiZ1wiKTtcbiAgICByZXN1bHQgPSByZXN1bHQucmVwbGFjZShyZWdleCwgc2hvcnROYW1lKTtcbiAgfVxuXG4gIHJldHVybiByZXN1bHQ7XG59XG5cbi8qKlxuICogQ29tcHJlc3MgQ1NTIHZhbHVlcyAobm9uLWRlc3RydWN0aXZlIG1pbmlmaWNhdGlvbilcbiAqL1xuZnVuY3Rpb24gY29tcHJlc3NDc3NWYWx1ZXMoY3NzOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gY3NzXG4gICAgLnJlcGxhY2UoL1xcYjArXFwuKFxcZCkvZywgXCIuJDFcIilcbiAgICAucmVwbGFjZSgvXFxiMChweHxyZW18ZW18dmh8dnd8dm1pbnx2bWF4fGNofGV4KVxcYi9nLCBcIjBcIilcbiAgICAucmVwbGFjZSgvXFxzKjpcXHMqL2csIFwiOlwiKVxuICAgIC5yZXBsYWNlKC9cXHMqO1xccyovZywgXCI7XCIpXG4gICAgLnJlcGxhY2UoLzt9L2csIFwifVwiKVxuICAgIC5yZXBsYWNlKC9cXHMqXFx7L2csIFwie1wiKVxuICAgIC5yZXBsYWNlKC9cXHtcXHMqL2csIFwie1wiKVxuICAgIC5yZXBsYWNlKC9cXHMqXFx9L2csIFwifVwiKVxuICAgIC5yZXBsYWNlKC9cXHMrL2csIFwiIFwiKVxuICAgIC5yZXBsYWNlKC9cXG4vZywgXCJcIilcbiAgICAudHJpbSgpO1xufVxuXG4vKipcbiAqIFByb2Nlc3MgQ1NTIGJhc2VkIG9uIGJ1aWxkIG1vZGUgY29uZmlndXJhdGlvblxuICovXG5mdW5jdGlvbiBwcm9jZXNzQ3NzKGNzczogc3RyaW5nLCBjb25maWc6IEJ1aWxkTW9kZUNvbmZpZyk6IHN0cmluZyB7XG4gIGxldCByZXN1bHQgPSBjc3M7XG5cbiAgaWYgKGNvbmZpZy5jc3NSZW1vdmVDb21tZW50cykge1xuICAgIHJlc3VsdCA9IHJlbW92ZUNzc0NvbW1lbnRzKHJlc3VsdCk7XG4gIH1cblxuICBpZiAoY29uZmlnLmNzc1ZhcmlhYmxlU2hvcnRlbmluZykge1xuICAgIHJlc3VsdCA9IHNob3J0ZW5Dc3NWYXJpYWJsZXMocmVzdWx0KTtcbiAgfVxuXG4gIGlmIChjb25maWcuY3NzVmFsdWVNaW5pZnkpIHtcbiAgICByZXN1bHQgPSBjb21wcmVzc0Nzc1ZhbHVlcyhyZXN1bHQpO1xuICB9XG5cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuLyoqXG4gKiBFeHRyYWN0IENTUyBjb250ZW50IGZyb20gYnVuZGxlIGFzc2V0c1xuICovXG5mdW5jdGlvbiBleHRyYWN0Q3NzRnJvbUJ1bmRsZShcbiAgYnVuZGxlOiBSZWNvcmQ8c3RyaW5nLCB7IHR5cGU6IHN0cmluZzsgc291cmNlPzogc3RyaW5nIHwgVWludDhBcnJheSB9PixcbiAgY29uZmlnOiBCdWlsZE1vZGVDb25maWcsXG4pOiBzdHJpbmcge1xuICBjb25zdCBjc3NDaHVua3M6IHN0cmluZ1tdID0gW107XG5cbiAgZm9yIChjb25zdCBbZmlsZU5hbWUsIGFzc2V0XSBvZiBPYmplY3QuZW50cmllcyhidW5kbGUpKSB7XG4gICAgaWYgKCFmaWxlTmFtZS5lbmRzV2l0aChcIi5jc3NcIikgfHwgYXNzZXQudHlwZSAhPT0gXCJhc3NldFwiKSBjb250aW51ZTtcblxuICAgIGNvbnN0IHsgc291cmNlIH0gPSBhc3NldDtcbiAgICBsZXQgY3NzQ29udGVudCA9IFwiXCI7XG4gICAgaWYgKHR5cGVvZiBzb3VyY2UgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgIGNzc0NvbnRlbnQgPSBzb3VyY2U7XG4gICAgfSBlbHNlIGlmIChzb3VyY2UgaW5zdGFuY2VvZiBVaW50OEFycmF5KSB7XG4gICAgICBjc3NDb250ZW50ID0gbmV3IFRleHREZWNvZGVyKCkuZGVjb2RlKHNvdXJjZSk7XG4gICAgfVxuXG4gICAgaWYgKGNzc0NvbnRlbnQpIHtcbiAgICAgIGNzc0NvbnRlbnQgPSBwcm9jZXNzQ3NzKGNzc0NvbnRlbnQsIGNvbmZpZyk7XG4gICAgfVxuXG4gICAgY3NzQ2h1bmtzLnB1c2goY3NzQ29udGVudCk7XG4gICAgZGVsZXRlIGJ1bmRsZVtmaWxlTmFtZV07XG4gIH1cblxuICByZXR1cm4gY3NzQ2h1bmtzLmpvaW4oY29uZmlnLmNzc0NvbXByZXNzID8gXCJcIiA6IFwiXFxuXCIpO1xufVxuXG4vKipcbiAqIEdlbmVyYXRlIENTUyBpbmplY3Rpb24gY29kZSBmb3IgdXNlcnNjcmlwdFxuICovXG5mdW5jdGlvbiBnZW5lcmF0ZUNzc0luamVjdGlvbkNvZGUoY3NzOiBzdHJpbmcsIGlzRGV2OiBib29sZWFuKTogc3RyaW5nIHtcbiAgcmV0dXJuIGBcbihmdW5jdGlvbigpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuICBpZiAodHlwZW9mIGRvY3VtZW50ID09PSAndW5kZWZpbmVkJykgcmV0dXJuO1xuXG4gIHZhciBjc3MgPSAke0pTT04uc3RyaW5naWZ5KGNzcyl9O1xuXG4gIHZhciBleGlzdGluZ1N0eWxlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJyR7U1RZTEVfSUR9Jyk7XG4gIGlmIChleGlzdGluZ1N0eWxlKSB7XG4gICAgZXhpc3RpbmdTdHlsZS50ZXh0Q29udGVudCA9IGNzcztcbiAgICByZXR1cm47XG4gIH1cblxuICB2YXIgc3R5bGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzdHlsZScpO1xuICBzdHlsZS5pZCA9ICcke1NUWUxFX0lEfSc7XG4gIHN0eWxlLnNldEF0dHJpYnV0ZSgnZGF0YS14ZWctdmVyc2lvbicsICcke2lzRGV2ID8gXCJkZXZcIiA6IFwicHJvZFwifScpO1xuICBzdHlsZS50ZXh0Q29udGVudCA9IGNzcztcblxuICAoZG9jdW1lbnQuaGVhZCB8fCBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQpLmFwcGVuZENoaWxkKHN0eWxlKTtcbn0pKCk7XG5gO1xufVxuXG4vLyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbi8vIENTUyBJbmxpbmUgUGx1Z2luXG4vLyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcblxuLyoqXG4gKiBWaXRlIHBsdWdpbiB0byBpbmxpbmUgQ1NTIGludG8gSmF2YVNjcmlwdCBidW5kbGVcbiAqIE9wdGltaXplZCBmb3IgVGFtcGVybW9ua2V5L3VzZXJzY3JpcHQgZW52aXJvbm1lbnRzXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjc3NJbmxpbmVQbHVnaW4obW9kZTogc3RyaW5nKTogUGx1Z2luIHtcbiAgY29uc3QgaXNEZXYgPSBtb2RlID09PSBcImRldmVsb3BtZW50XCI7XG4gIGNvbnN0IGNvbmZpZyA9IGdldEJ1aWxkTW9kZUNvbmZpZyhtb2RlKTtcblxuICByZXR1cm4ge1xuICAgIG5hbWU6IFwiY3NzLWlubGluZVwiLFxuICAgIGFwcGx5OiBcImJ1aWxkXCIsXG4gICAgZW5mb3JjZTogXCJwb3N0XCIsXG5cbiAgICBnZW5lcmF0ZUJ1bmRsZShfb3B0aW9ucywgYnVuZGxlKSB7XG4gICAgICBjb25zdCBjc3NDb250ZW50ID0gZXh0cmFjdENzc0Zyb21CdW5kbGUoXG4gICAgICAgIGJ1bmRsZSBhcyBSZWNvcmQ8XG4gICAgICAgICAgc3RyaW5nLFxuICAgICAgICAgIHsgdHlwZTogc3RyaW5nOyBzb3VyY2U/OiBzdHJpbmcgfCBVaW50OEFycmF5IH1cbiAgICAgICAgPixcbiAgICAgICAgY29uZmlnLFxuICAgICAgKTtcblxuICAgICAgaWYgKCFjc3NDb250ZW50LnRyaW0oKSkgcmV0dXJuO1xuXG4gICAgICBmb3IgKGNvbnN0IGNodW5rIG9mIE9iamVjdC52YWx1ZXMoYnVuZGxlKSkge1xuICAgICAgICBpZiAoY2h1bmsudHlwZSA9PT0gXCJjaHVua1wiICYmIGNodW5rLmlzRW50cnkpIHtcbiAgICAgICAgICBjaHVuay5jb2RlID0gZ2VuZXJhdGVDc3NJbmplY3Rpb25Db2RlKGNzc0NvbnRlbnQsIGlzRGV2KSArIGNodW5rLmNvZGU7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9LFxuICB9O1xufVxuXG4vLyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbi8vIExvZyBDYWxsIFJlbW92YWwgVXRpbGl0eVxuLy8gXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5cbi8qKlxuICogUmVtb3ZlIGxvZyBjYWxscyB3aXRoIGJhbGFuY2VkIHBhcmVudGhlc2VzIG1hdGNoaW5nXG4gKiBIYW5kbGVzIGNvbXBsZXggYXJndW1lbnRzIGluY2x1ZGluZyBuZXN0ZWQgZnVuY3Rpb24gY2FsbHMgYW5kIG9iamVjdCBsaXRlcmFsc1xuICogQWxzbyBoYW5kbGVzIGFycm93IGZ1bmN0aW9ucyB3aGVyZSBsb2cgY2FsbCBpcyB0aGUgb25seSBib2R5XG4gKi9cbmZ1bmN0aW9uIHJlbW92ZUxvZ0NhbGxzKGNvZGU6IHN0cmluZywgbWV0aG9kczogc3RyaW5nW10pOiBzdHJpbmcge1xuICAvLyBCdWlsZCBwYXR0ZXJuIGZvciBsb2dnZXIubWV0aG9kKCBvciBsb2dnZXIkTi5tZXRob2QoIG9yIGxvZ2dlcj8ubWV0aG9kKFxuICBjb25zdCBtZXRob2RQYXR0ZXJuID0gbWV0aG9kcy5qb2luKFwifFwiKTtcbiAgY29uc3QgcmVnZXggPSBuZXcgUmVnRXhwKFxuICAgIGBsb2dnZXIoPzpcXFxcJFxcXFxkKyk/XFxcXD9cXFxcLig/OiR7bWV0aG9kUGF0dGVybn0pXFxcXCh8bG9nZ2VyKD86XFxcXCRcXFxcZCspP1xcXFwuKD86JHttZXRob2RQYXR0ZXJufSlcXFxcKGAsXG4gICAgXCJnXCIsXG4gICk7XG5cbiAgbGV0IHJlc3VsdCA9IFwiXCI7XG4gIGxldCBsYXN0SW5kZXggPSAwO1xuICBsZXQgbWF0Y2g6IFJlZ0V4cEV4ZWNBcnJheSB8IG51bGw7XG5cbiAgd2hpbGUgKChtYXRjaCA9IHJlZ2V4LmV4ZWMoY29kZSkpICE9PSBudWxsKSB7XG4gICAgY29uc3Qgc3RhcnRJbmRleCA9IG1hdGNoLmluZGV4O1xuICAgIGNvbnN0IG9wZW5QYXJlbkluZGV4ID0gc3RhcnRJbmRleCArIG1hdGNoWzBdLmxlbmd0aCAtIDE7XG5cbiAgICAvLyBGaW5kIHRoZSBtYXRjaGluZyBjbG9zaW5nIHBhcmVudGhlc2lzXG4gICAgbGV0IGRlcHRoID0gMTtcbiAgICBsZXQgaSA9IG9wZW5QYXJlbkluZGV4ICsgMTtcbiAgICBsZXQgaW5TdHJpbmcgPSBmYWxzZTtcbiAgICBsZXQgc3RyaW5nQ2hhciA9IFwiXCI7XG4gICAgbGV0IGluVGVtcGxhdGUgPSBmYWxzZTtcbiAgICBsZXQgdGVtcGxhdGVEZXB0aCA9IDA7XG5cbiAgICB3aGlsZSAoaSA8IGNvZGUubGVuZ3RoICYmIGRlcHRoID4gMCkge1xuICAgICAgY29uc3QgY2hhciA9IGNvZGVbaV07XG4gICAgICBjb25zdCBwcmV2Q2hhciA9IGNvZGVbaSAtIDFdO1xuXG4gICAgICAvLyBIYW5kbGUgc3RyaW5nIGxpdGVyYWxzXG4gICAgICBpZiAoXG4gICAgICAgICFpblN0cmluZyAmJiAhaW5UZW1wbGF0ZSAmJlxuICAgICAgICAoY2hhciA9PT0gJ1wiJyB8fCBjaGFyID09PSBcIidcIiB8fCBjaGFyID09PSBcImBcIilcbiAgICAgICkge1xuICAgICAgICBpblN0cmluZyA9IHRydWU7XG4gICAgICAgIHN0cmluZ0NoYXIgPSBjaGFyO1xuICAgICAgICBpZiAoY2hhciA9PT0gXCJgXCIpIHtcbiAgICAgICAgICBpblRlbXBsYXRlID0gdHJ1ZTtcbiAgICAgICAgICBpblN0cmluZyA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKGluU3RyaW5nICYmIGNoYXIgPT09IHN0cmluZ0NoYXIgJiYgcHJldkNoYXIgIT09IFwiXFxcXFwiKSB7XG4gICAgICAgIGluU3RyaW5nID0gZmFsc2U7XG4gICAgICB9IGVsc2UgaWYgKGluVGVtcGxhdGUpIHtcbiAgICAgICAgaWYgKGNoYXIgPT09IFwiYFwiICYmIHByZXZDaGFyICE9PSBcIlxcXFxcIikge1xuICAgICAgICAgIGluVGVtcGxhdGUgPSBmYWxzZTtcbiAgICAgICAgfSBlbHNlIGlmIChjaGFyID09PSBcIiRcIiAmJiBjb2RlW2kgKyAxXSA9PT0gXCJ7XCIpIHtcbiAgICAgICAgICB0ZW1wbGF0ZURlcHRoKys7XG4gICAgICAgICAgaSsrO1xuICAgICAgICB9IGVsc2UgaWYgKGNoYXIgPT09IFwifVwiICYmIHRlbXBsYXRlRGVwdGggPiAwKSB7XG4gICAgICAgICAgdGVtcGxhdGVEZXB0aC0tO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKCFpblN0cmluZyAmJiAhaW5UZW1wbGF0ZSkge1xuICAgICAgICBpZiAoY2hhciA9PT0gXCIoXCIpIGRlcHRoKys7XG4gICAgICAgIGVsc2UgaWYgKGNoYXIgPT09IFwiKVwiKSBkZXB0aC0tO1xuICAgICAgfVxuXG4gICAgICBpKys7XG4gICAgfVxuXG4gICAgaWYgKGRlcHRoID09PSAwKSB7XG4gICAgICAvLyBBcHBlbmQgY29kZSBiZWZvcmUgdGhpcyBsb2cgY2FsbFxuICAgICAgcmVzdWx0ICs9IGNvZGUuc2xpY2UobGFzdEluZGV4LCBzdGFydEluZGV4KTtcblxuICAgICAgLy8gQ2hlY2sgaWYgdGhpcyBpcyBhbiBhcnJvdyBmdW5jdGlvbiBib2R5ICg9PiBsb2dnZXIueHh4KC4uLikpXG4gICAgICAvLyBMb29rIGJhY2sgZm9yIFwiPT4gXCIgb3IgXCI9PlwiIHBhdHRlcm5cbiAgICAgIGNvbnN0IGJlZm9yZUxvZyA9IHJlc3VsdC5zbGljZSgtMjApOyAvLyBDaGVjayBsYXN0IDIwIGNoYXJzXG4gICAgICBjb25zdCBpc0Fycm93Rm5Cb2R5ID0gLz0+XFxzKiQvLnRlc3QoYmVmb3JlTG9nKTtcblxuICAgICAgaWYgKGlzQXJyb3dGbkJvZHkpIHtcbiAgICAgICAgLy8gUmVwbGFjZSB3aXRoIGVtcHR5IGJsb2NrIGZvciBhcnJvdyBmdW5jdGlvblxuICAgICAgICByZXN1bHQgKz0gXCJ7fVwiO1xuICAgICAgfVxuXG4gICAgICAvLyBTa2lwIHRoZSBsb2cgY2FsbCwgYWxzbyBjb25zdW1lIHRyYWlsaW5nIHNlbWljb2xvbiBhbmQgbmV3bGluZSBpZiBwcmVzZW50XG4gICAgICBsZXQgZW5kSW5kZXggPSBpO1xuICAgICAgaWYgKGNvZGVbZW5kSW5kZXhdID09PSBcIjtcIikgZW5kSW5kZXgrKztcbiAgICAgIGlmIChjb2RlW2VuZEluZGV4XSA9PT0gXCJcXG5cIikgZW5kSW5kZXgrKztcblxuICAgICAgbGFzdEluZGV4ID0gZW5kSW5kZXg7XG4gICAgICByZWdleC5sYXN0SW5kZXggPSBlbmRJbmRleDtcbiAgICB9XG4gIH1cblxuICAvLyBBcHBlbmQgcmVtYWluaW5nIGNvZGVcbiAgcmVzdWx0ICs9IGNvZGUuc2xpY2UobGFzdEluZGV4KTtcbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuLy8gXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG4vLyBQcm9kdWN0aW9uIENsZWFudXAgUGx1Z2luXG4vLyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcblxuLyoqXG4gKiBQcm9kdWN0aW9uIG9wdGltaXphdGlvbiBwbHVnaW5cbiAqIFJlbW92ZXMgdW5uZWNlc3NhcnkgY29kZSBwYXR0ZXJucyBmcm9tIHRoZSBmaW5hbCBidW5kbGU6XG4gKiAtIEVtcHR5IG1vZHVsZSBuYW1lc3BhY2Ugb2JqZWN0cyAoT2JqZWN0LmZyZWV6ZSArIGRlZmluZVByb3BlcnR5ICsgU3ltYm9sLnRvU3RyaW5nVGFnKVxuICogLSAvKiNfX1BVUkVfXypcdTIwMEIvIGFubm90YXRpb25zIChub3QgbmVlZGVkIHdpdGhvdXQgbWluaWZpY2F0aW9uKVxuICogLSBEZWJ1Zy9pbmZvIGxvZyBjYWxscyAoc2lnbmlmaWNhbnQgc3RyaW5nIHNhdmluZ3MpXG4gKiAtIFVudXNlZCB2YXJpYWJsZSBkZWNsYXJhdGlvbnNcbiAqL1xuZnVuY3Rpb24gcHJvZHVjdGlvbkNsZWFudXBQbHVnaW4oKTogUGx1Z2luIHtcbiAgcmV0dXJuIHtcbiAgICBuYW1lOiBcInByb2R1Y3Rpb24tY2xlYW51cFwiLFxuICAgIGFwcGx5OiBcImJ1aWxkXCIsXG4gICAgZW5mb3JjZTogXCJwb3N0XCIsXG5cbiAgICBnZW5lcmF0ZUJ1bmRsZShfb3B0aW9ucywgYnVuZGxlKSB7XG4gICAgICBmb3IgKGNvbnN0IGNodW5rIG9mIE9iamVjdC52YWx1ZXMoYnVuZGxlKSkge1xuICAgICAgICBpZiAoY2h1bmsudHlwZSAhPT0gXCJjaHVua1wiKSBjb250aW51ZTtcblxuICAgICAgICBsZXQgY29kZSA9IGNodW5rLmNvZGU7XG5cbiAgICAgICAgLy8gMS4gUmVtb3ZlIGVtcHR5IG1vZHVsZSBuYW1lc3BhY2Ugb2JqZWN0c1xuICAgICAgICBjb2RlID0gY29kZS5yZXBsYWNlKFxuICAgICAgICAgIC9jb25zdFxccytcXHcrXFxzKj1cXHMqKD86XFwvXFwqI19fUFVSRV9fXFwqXFwvXFxzKik/T2JqZWN0XFwuZnJlZXplXFwoXFxzKig/OlxcL1xcKiNfX1BVUkVfX1xcKlxcL1xccyopP09iamVjdFxcLmRlZmluZVByb3BlcnR5XFwoXFxzKlxce1xccypfX3Byb3RvX19cXHMqOlxccypudWxsXFxzKlxcfVxccyosXFxzKlN5bWJvbFxcLnRvU3RyaW5nVGFnXFxzKixcXHMqXFx7XFxzKnZhbHVlXFxzKjpcXHMqWydcIl1Nb2R1bGVbJ1wiXVxccypcXH1cXHMqXFwpXFxzKlxcKVxccyo7P1xcbj8vZyxcbiAgICAgICAgICBcIlwiLFxuICAgICAgICApO1xuXG4gICAgICAgIC8vIDIuIFJlbW92ZSAvKiNfX1BVUkVfXyovIGFubm90YXRpb25zXG4gICAgICAgIGNvZGUgPSBjb2RlLnJlcGxhY2UoL1xcL1xcKiNfX1BVUkVfX1xcKlxcL1xccyovZywgXCJcIik7XG5cbiAgICAgICAgLy8gMy4gUmVtb3ZlIHN0YW5kYWxvbmUgT2JqZWN0LmZyZWV6ZSh7X19wcm90b19fOiBudWxsfSkgcGF0dGVybnNcbiAgICAgICAgY29kZSA9IGNvZGUucmVwbGFjZShcbiAgICAgICAgICAvT2JqZWN0XFwuZnJlZXplXFwoXFxzKlxce1xccypfX3Byb3RvX19cXHMqOlxccypudWxsXFxzKlxcfVxccypcXCkvZyxcbiAgICAgICAgICBcIih7fSlcIixcbiAgICAgICAgKTtcblxuICAgICAgICAvLyA0LiBSZW1vdmUgZGVidWcvaW5mbyBsb2cgY2FsbHMgdXNpbmcgYmFsYW5jZWQgcGFyZW50aGVzZXMgbWF0Y2hpbmdcbiAgICAgICAgLy8gVGhlc2UgYXJlIGRldmVsb3BtZW50LW9ubHkgbG9ncyB0aGF0IGNhbiBhZGQgc2lnbmlmaWNhbnQgc3RyaW5nIGNvbnRlbnRcbiAgICAgICAgY29kZSA9IHJlbW92ZUxvZ0NhbGxzKGNvZGUsIFtcImRlYnVnXCIsIFwiaW5mb1wiXSk7XG5cbiAgICAgICAgLy8gNS4gU2ltcGxpZnkgY3JlYXRlU2luZ2xldG9uIHBhdHRlcm4gKHJlbW92ZSByZXNldCgpIG1ldGhvZCBmb3IgcHJvZHVjdGlvbilcbiAgICAgICAgLy8gUGF0dGVybjogeyBnZXQoKSB7IC4uLiB9LCByZXNldCgpIHsgaW5zdGFuY2UgPSBudWxsOyB9IH1cbiAgICAgICAgLy8gUmVwbGFjZSB3aXRoOiB7IGdldCgpIHsgLi4uIH0gfVxuICAgICAgICBjb2RlID0gY29kZS5yZXBsYWNlKFxuICAgICAgICAgIC8sXFxzKnJlc2V0XFwoXFwpXFxzKlxce1xccyppbnN0YW5jZVxccyo9XFxzKm51bGw7XFxzKlxcfS9nLFxuICAgICAgICAgIFwiXCIsXG4gICAgICAgICk7XG5cbiAgICAgICAgLy8gNi4gUmVtb3ZlIHN0YXRpYyByZXNldEZvclRlc3RzIG1ldGhvZHMgKHRlc3Qtb25seSlcbiAgICAgICAgY29kZSA9IGNvZGUucmVwbGFjZShcbiAgICAgICAgICAvc3RhdGljXFxzK3Jlc2V0Rm9yVGVzdHNcXChcXClcXHMqXFx7W159XSpcXH0vZyxcbiAgICAgICAgICBcIlwiLFxuICAgICAgICApO1xuXG4gICAgICAgIC8vIDcuIFJlbW92ZSBJSUZFIGV4cG9ydHMgKHVzZXJzY3JpcHQgZG9lc24ndCBuZWVkIGV4dGVybmFsIEFQSSlcbiAgICAgICAgLy8gUGF0dGVybjogZXhwb3J0cy54eHg9eHh4OyBvciBleHBvcnRzLnh4eCA9IHh4eDtcbiAgICAgICAgY29kZSA9IGNvZGUucmVwbGFjZShcbiAgICAgICAgICAvZXhwb3J0c1xcLlthLXpBLVpfJF1bYS16QS1aMC05XyRdKlxccyo9XFxzKlteO10rOy9nLFxuICAgICAgICAgIFwiXCIsXG4gICAgICAgICk7XG4gICAgICAgIC8vIFJlbW92ZSBfX2VzTW9kdWxlIG1hcmtlclxuICAgICAgICBjb2RlID0gY29kZS5yZXBsYWNlKFxuICAgICAgICAgIC9PYmplY3RcXC5kZWZpbmVQcm9wZXJ0eVxcKGV4cG9ydHMsWydcIl1fX2VzTW9kdWxlWydcIl0sXFx7dmFsdWU6dHJ1ZVxcfVxcKTs/L2csXG4gICAgICAgICAgXCJcIixcbiAgICAgICAgKTtcblxuICAgICAgICAvLyA4LiBSZW1vdmUgQGludGVybmFsIEpTRG9jIGNvbW1lbnRzICh0ZXN0LW9ubHkgbWFya2VycylcbiAgICAgICAgLy8gU2luZ2xlLWxpbmU6IC8qKiBAaW50ZXJuYWwgKi8gb3IgLyoqIEBpbnRlcm5hbCBUZXN0IGhlbHBlciAqL1xuICAgICAgICBjb2RlID0gY29kZS5yZXBsYWNlKC9cXHMqXFwvXFwqXFwqXFxzKkBpbnRlcm5hbFteKl0qXFwqXFwvXFxzKi9nLCBcIlxcblwiKTtcbiAgICAgICAgLy8gTXVsdGktbGluZSBKU0RvYyBibG9ja3MgdGhhdCBPTkxZIGNvbnRhaW4gQGludGVybmFsIChubyBvdGhlciBtZWFuaW5nZnVsIGNvbnRlbnQpXG4gICAgICAgIC8vIFRoaXMgbWF0Y2hlcyBibG9ja3MgbGlrZTpcbiAgICAgICAgLy8gLyoqXG4gICAgICAgIC8vICAqIFJlc2V0IHNpbmdsZXRvbiBpbnN0YW5jZSAoZm9yIHRlc3Rpbmcgb25seSlcbiAgICAgICAgLy8gICogQGludGVybmFsXG4gICAgICAgIC8vICAqL1xuICAgICAgICBjb2RlID0gY29kZS5yZXBsYWNlKFxuICAgICAgICAgIC9cXHMqXFwvXFwqXFwqXFxzKlxcblxccypcXCpbXkBdKkBpbnRlcm5hbFxccypcXG5cXHMqXFwqXFwvXFxzKi9nLFxuICAgICAgICAgIFwiXFxuXCIsXG4gICAgICAgICk7XG5cbiAgICAgICAgLy8gOS4gUmVtb3ZlIGxpbmVzIHRoYXQgb25seSBjb250YWluIHdoaXRlc3BhY2UgKGluZGVudGVkIGVtcHR5IGxpbmVzKVxuICAgICAgICBjb2RlID0gY29kZS5yZXBsYWNlKC9eWyBcXHRdKyQvZ20sIFwiXCIpO1xuXG4gICAgICAgIC8vIDEwLiBDbGVhbiB1cCBtdWx0aXBsZSBjb25zZWN1dGl2ZSBlbXB0eSBsaW5lc1xuICAgICAgICBjb2RlID0gY29kZS5yZXBsYWNlKC9cXG57Myx9L2csIFwiXFxuXFxuXCIpO1xuXG4gICAgICAgIGNodW5rLmNvZGUgPSBjb2RlO1xuICAgICAgfVxuICAgIH0sXG4gIH07XG59XG5cbi8vIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuLy8gUGF0aCBBbGlhc2VzXG4vLyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcblxuLyoqXG4gKiBCdWlsZCBwYXRoIGFsaWFzZXMgZm9yIFZpdGUgcmVzb2x2ZSBjb25maWd1cmF0aW9uXG4gKi9cbmZ1bmN0aW9uIGJ1aWxkUGF0aEFsaWFzZXMocm9vdDogc3RyaW5nKTogUmVjb3JkPHN0cmluZywgc3RyaW5nPiB7XG4gIHJldHVybiBPYmplY3QuZnJvbUVudHJpZXMoXG4gICAgT2JqZWN0LmVudHJpZXMoUEFUSF9BTElBU0VTKS5tYXAoKFxuICAgICAgW2FsaWFzLCBwYXRoXSxcbiAgICApID0+IFthbGlhcywgcmVzb2x2ZShyb290LCBwYXRoKV0pLFxuICApO1xufVxuXG4vLyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbi8vIFZpdGUgQ29uZmlndXJhdGlvblxuLy8gXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZygoeyBtb2RlIH0pOiBVc2VyQ29uZmlnID0+IHtcbiAgY29uc3QgaXNEZXYgPSBtb2RlID09PSBcImRldmVsb3BtZW50XCI7XG4gIGNvbnN0IGNvbmZpZyA9IGdldEJ1aWxkTW9kZUNvbmZpZyhtb2RlKTtcbiAgY29uc3Qgb3V0cHV0RmlsZU5hbWUgPSBpc0RldiA/IE9VVFBVVF9GSUxFX05BTUVTLmRldiA6IE9VVFBVVF9GSUxFX05BTUVTLnByb2Q7XG4gIGNvbnN0IHJvb3QgPSBwcm9jZXNzLmN3ZCgpO1xuXG4gIHJldHVybiB7XG4gICAgcGx1Z2luczogW1xuICAgICAgc29saWRQbHVnaW4oKSxcbiAgICAgIGNzc0lubGluZVBsdWdpbihtb2RlKSxcbiAgICAgIC8vIFByb2R1Y3Rpb246IFJlbW92ZSBlbXB0eSBtb2R1bGUgbmFtZXNwYWNlIG9iamVjdHMgYW5kIGNsZWFudXBcbiAgICAgIC4uLighaXNEZXYgPyBbcHJvZHVjdGlvbkNsZWFudXBQbHVnaW4oKV0gOiBbXSksXG4gICAgXSxcbiAgICByb290LFxuXG4gICAgcmVzb2x2ZToge1xuICAgICAgYWxpYXM6IGJ1aWxkUGF0aEFsaWFzZXMocm9vdCksXG4gICAgfSxcblxuICAgIGJ1aWxkOiB7XG4gICAgICB0YXJnZXQ6IFwiZXNuZXh0XCIsXG4gICAgICBtaW5pZnk6IGZhbHNlLCAvLyBLZWVwIHJlYWRhYmxlIGZvciBHcmVhc3kgRm9yayBwb2xpY3lcbiAgICAgIHNvdXJjZW1hcDogY29uZmlnLnNvdXJjZU1hcCxcbiAgICAgIG91dERpcjogXCJkaXN0XCIsXG4gICAgICBlbXB0eU91dERpcjogZmFsc2UsXG4gICAgICB3cml0ZTogdHJ1ZSxcbiAgICAgIGNzc0NvZGVTcGxpdDogZmFsc2UsXG4gICAgICBjc3NNaW5pZnk6IGZhbHNlLFxuXG4gICAgICBsaWI6IHtcbiAgICAgICAgZW50cnk6IHJlc29sdmUocm9vdCwgXCIuL3NyYy9tYWluLnRzXCIpLFxuICAgICAgICBuYW1lOiBcIlhjb21FbmhhbmNlZEdhbGxlcnlcIixcbiAgICAgICAgZm9ybWF0czogW1wiaWlmZVwiXSxcbiAgICAgICAgZmlsZU5hbWU6ICgpID0+IG91dHB1dEZpbGVOYW1lLnJlcGxhY2UoXCIudXNlci5qc1wiLCBcIlwiKSxcbiAgICAgICAgY3NzRmlsZU5hbWU6IFwic3R5bGVcIixcbiAgICAgIH0sXG5cbiAgICAgIHJvbGx1cE9wdGlvbnM6IHtcbiAgICAgICAgb3V0cHV0OiB7XG4gICAgICAgICAgZW50cnlGaWxlTmFtZXM6IG91dHB1dEZpbGVOYW1lLFxuICAgICAgICAgIGlubGluZUR5bmFtaWNJbXBvcnRzOiB0cnVlLFxuICAgICAgICAgIGV4cG9ydHM6IFwibmFtZWRcIixcbiAgICAgICAgICAvLyBQcm9kdWN0aW9uIG9wdGltaXphdGlvbnNcbiAgICAgICAgICAuLi4oIWlzRGV2ICYmIHtcbiAgICAgICAgICAgIC8vIERpc2FibGUgT2JqZWN0LmZyZWV6ZSgpIG9uIG1vZHVsZSBuYW1lc3BhY2Ugb2JqZWN0c1xuICAgICAgICAgICAgZnJlZXplOiBmYWxzZSxcbiAgICAgICAgICAgIC8vIFVzZSBjb25zdCBiaW5kaW5ncyBmb3IgYmV0dGVyIG9wdGltaXphdGlvblxuICAgICAgICAgICAgZ2VuZXJhdGVkQ29kZToge1xuICAgICAgICAgICAgICBzeW1ib2xzOiBmYWxzZSxcbiAgICAgICAgICAgICAgY29uc3RCaW5kaW5nczogdHJ1ZSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvLyBSZW1vdmUgdW5uZWNlc3Nhcnkgd2hpdGVzcGFjZSAobm90IG9iZnVzY2F0aW9uKVxuICAgICAgICAgICAgY29tcGFjdDogdHJ1ZSxcbiAgICAgICAgICB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgLy8gVHJlZS1zaGFrZSBtb3JlIGFnZ3Jlc3NpdmVseSBpbiBwcm9kdWN0aW9uXG4gICAgICAgIHRyZWVzaGFrZTogaXNEZXYgPyBmYWxzZSA6IHtcbiAgICAgICAgICBtb2R1bGVTaWRlRWZmZWN0czogZmFsc2UsXG4gICAgICAgICAgcHJvcGVydHlSZWFkU2lkZUVmZmVjdHM6IGZhbHNlLFxuICAgICAgICAgIHRyeUNhdGNoRGVvcHRpbWl6YXRpb246IGZhbHNlLFxuICAgICAgICAgIHVua25vd25HbG9iYWxTaWRlRWZmZWN0czogZmFsc2UsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgIH0sXG5cbiAgICBjc3M6IHtcbiAgICAgIG1vZHVsZXM6IHtcbiAgICAgICAgZ2VuZXJhdGVTY29wZWROYW1lOiBjb25maWcuY3NzQ2xhc3NOYW1lUGF0dGVybixcbiAgICAgICAgbG9jYWxzQ29udmVudGlvbjogXCJjYW1lbENhc2VPbmx5XCIsXG4gICAgICAgIHNjb3BlQmVoYXZpb3VyOiBcImxvY2FsXCIsXG4gICAgICB9LFxuICAgICAgZGV2U291cmNlbWFwOiBpc0RldixcbiAgICB9LFxuXG4gICAgZGVmaW5lOiB7XG4gICAgICBfX0RFVl9fOiBKU09OLnN0cmluZ2lmeShpc0RldiksXG4gICAgICBcImltcG9ydC5tZXRhLmVudi5NT0RFXCI6IEpTT04uc3RyaW5naWZ5KG1vZGUpLFxuICAgICAgXCJpbXBvcnQubWV0YS5lbnYuREVWXCI6IEpTT04uc3RyaW5naWZ5KGlzRGV2KSxcbiAgICAgIFwiaW1wb3J0Lm1ldGEuZW52LlBST0RcIjogSlNPTi5zdHJpbmdpZnkoIWlzRGV2KSxcbiAgICB9LFxuXG4gICAgbG9nTGV2ZWw6IFwid2FyblwiLFxuICB9O1xufSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBbUJBLFNBQVMsZUFBZTtBQUN4QixTQUFTLG9CQUFrRDtBQUMzRCxPQUFPLGlCQUFpQjtBQU14QixJQUFNLFdBQVc7QUFFakIsSUFBTSxvQkFBb0I7QUFBQSxFQUN4QixLQUFLO0FBQUEsRUFDTCxNQUFNO0FBQ1I7QUFHQSxJQUFNLGVBQWU7QUFBQSxFQUNuQixLQUFLO0FBQUEsRUFDTCxjQUFjO0FBQUEsRUFDZCxjQUFjO0FBQUEsRUFDZCxhQUFhO0FBQUEsRUFDYixXQUFXO0FBQUEsRUFDWCxXQUFXO0FBQUEsRUFDWCxVQUFVO0FBQ1o7QUFzQk8sSUFBTSxxQkFBcUI7QUFBQSxFQUNoQyxhQUFhO0FBQUEsSUFDWCxhQUFhO0FBQUEsSUFDYixtQkFBbUI7QUFBQSxJQUNuQix1QkFBdUI7QUFBQSxJQUN2QixnQkFBZ0I7QUFBQSxJQUNoQixxQkFBcUI7QUFBQSxJQUNyQixXQUFXO0FBQUEsSUFDWCxjQUFjO0FBQUEsRUFDaEI7QUFBQSxFQUNBLFlBQVk7QUFBQSxJQUNWLGFBQWE7QUFBQSxJQUNiLG1CQUFtQjtBQUFBLElBQ25CLHVCQUF1QjtBQUFBLElBQ3ZCLGdCQUFnQjtBQUFBLElBQ2hCLHFCQUFxQjtBQUFBLElBQ3JCLFdBQVc7QUFBQSxJQUNYLGNBQWM7QUFBQSxFQUNoQjtBQUNGO0FBR08sU0FBUyxtQkFBbUIsTUFBK0I7QUFDaEUsU0FBTyxtQkFDTCxTQUFTLGdCQUFnQixnQkFBZ0IsWUFDM0M7QUFDRjtBQVNBLFNBQVMsa0JBQWtCLEtBQXFCO0FBQzlDLE1BQUksU0FBUztBQUNiLE1BQUksSUFBSTtBQUNSLE1BQUksV0FBVztBQUNmLE1BQUksYUFBYTtBQUVqQixTQUFPLElBQUksSUFBSSxRQUFRO0FBQ3JCLFFBQUksQ0FBQyxhQUFhLElBQUksQ0FBQyxNQUFNLE9BQU8sSUFBSSxDQUFDLE1BQU0sTUFBTTtBQUNuRCxpQkFB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

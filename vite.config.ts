/**
 * Vite Configuration for X.com Enhanced Gallery Userscript
 *
 * This configuration supports both development and production builds with
 * different optimization strategies:
 *
 * Development: Optimized for debugging and analysis
 * - Readable CSS class names (Component__className__hash)
 * - CSS formatting preserved
 * - Source maps enabled
 *
 * Production: Optimized for distribution size
 * - Hashed CSS class names (xeg_hash)
 * - CSS fully compressed
 * - No source maps
 *
 * @see scripts/build.ts for the build orchestration
 */

import { resolve } from "node:path";
import { defineConfig, type Plugin, type UserConfig } from "vite";
import solidPlugin from "vite-plugin-solid";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const STYLE_ID = "xeg-injected-styles" as const;

const OUTPUT_FILE_NAMES = {
  dev: "xcom-enhanced-gallery.dev.user.js",
  prod: "xcom-enhanced-gallery.user.js",
} as const;

// Path aliases (shared between Vite and TypeScript)
const PATH_ALIASES = {
  "@": "src",
  "@bootstrap": "src/bootstrap",
  "@constants": "src/constants",
  "@features": "src/features",
  "@shared": "src/shared",
  "@styles": "src/styles",
  "@types": "src/types",
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Build Mode Configuration
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build mode configuration interface
 */
export interface BuildModeConfig {
  readonly cssCompress: boolean;
  readonly cssRemoveComments: boolean;
  readonly cssVariableShortening: boolean;
  readonly cssValueMinify: boolean;
  readonly cssClassNamePattern: string;
  readonly sourceMap: boolean | "inline";
  readonly outputSuffix: string;
}

/**
 * Build mode configurations for development and production
 */
export const BUILD_MODE_CONFIGS = {
  development: {
    cssCompress: false,
    cssRemoveComments: false,
    cssVariableShortening: false,
    cssValueMinify: false,
    cssClassNamePattern: "[name]__[local]__[hash:base64:5]",
    sourceMap: "inline" as const,
    outputSuffix: ".dev",
  },
  production: {
    cssCompress: true,
    cssRemoveComments: true,
    cssVariableShortening: true,
    cssValueMinify: true,
    cssClassNamePattern: "xeg_[hash:base64:6]",
    sourceMap: false as const,
    outputSuffix: "",
  },
} satisfies Record<"development" | "production", BuildModeConfig>;

/** Get build mode config based on mode string */
export function getBuildModeConfig(mode: string): BuildModeConfig {
  return BUILD_MODE_CONFIGS[
    mode === "development" ? "development" : "production"
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// CSS Processing Utilities
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Remove CSS comments (preserves structure)
 */
function removeCssComments(css: string): string {
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
      if (
        result.length > 0 && result[result.length - 1] !== " " &&
        result[result.length - 1] !== "\n"
      ) {
        result += " ";
      }
      continue;
    }

    result += css[i];
    i++;
  }

  return result
    .replace(/  +/g, " ")
    .replace(/\n\s*\n/g, "\n")
    .replace(/^\s+/gm, "")
    .replace(/\s+$/gm, "")
    .trim();
}

/**
 * CSS variable shortening map for production builds
 * Maps verbose --xeg-* variable names to short alternatives
 */
const CSS_VAR_SHORTENING_MAP: Record<string, string> = {
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
  "--xeg-gallery-fit-height-target": "--xgf-ht",
};

/**
 * Shorten CSS variable names
 */
function shortenCssVariables(css: string): string {
  let result = css;
  const sortedEntries = Object.entries(CSS_VAR_SHORTENING_MAP)
    .sort((a, b) => b[0].length - a[0].length);

  for (const [longName, shortName] of sortedEntries) {
    const escapedLong = longName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(escapedLong, "g");
    result = result.replace(regex, shortName);
  }

  return result;
}

/**
 * Compress CSS values (non-destructive minification)
 */
function compressCssValues(css: string): string {
  return css
    .replace(/\b0+\.(\d)/g, ".$1")
    .replace(/\b0(px|rem|em|vh|vw|vmin|vmax|ch|ex)\b/g, "0")
    .replace(/\s*:\s*/g, ":")
    .replace(/\s*;\s*/g, ";")
    .replace(/;}/g, "}")
    .replace(/\s*\{/g, "{")
    .replace(/\{\s*/g, "{")
    .replace(/\s*\}/g, "}")
    .replace(/\s+/g, " ")
    .replace(/\n/g, "")
    .trim();
}

/**
 * Process CSS based on build mode configuration
 */
function processCss(css: string, config: BuildModeConfig): string {
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

/**
 * Extract CSS content from bundle assets
 */
function extractCssFromBundle(
  bundle: Record<string, { type: string; source?: string | Uint8Array }>,
  config: BuildModeConfig,
): string {
  const cssChunks: string[] = [];

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

/**
 * Generate CSS injection code for userscript
 */
function generateCssInjectionCode(css: string, isDev: boolean): string {
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

// ─────────────────────────────────────────────────────────────────────────────
// CSS Inline Plugin
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Vite plugin to inline CSS into JavaScript bundle
 * Optimized for Tampermonkey/userscript environments
 */
export function cssInlinePlugin(mode: string): Plugin {
  const isDev = mode === "development";
  const config = getBuildModeConfig(mode);

  return {
    name: "css-inline",
    apply: "build",
    enforce: "post",

    generateBundle(_options, bundle) {
      const cssContent = extractCssFromBundle(
        bundle as Record<
          string,
          { type: string; source?: string | Uint8Array }
        >,
        config,
      );

      if (!cssContent.trim()) return;

      for (const chunk of Object.values(bundle)) {
        if (chunk.type === "chunk" && chunk.isEntry) {
          chunk.code = generateCssInjectionCode(cssContent, isDev) + chunk.code;
          break;
        }
      }
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Log Call Removal Utility
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Remove log calls with balanced parentheses matching
 * Handles complex arguments including nested function calls and object literals
 * Also handles arrow functions where log call is the only body
 */
function removeLogCalls(code: string, methods: string[]): string {
  // Build pattern for logger.method( or logger$N.method( or logger?.method(
  const methodPattern = methods.join("|");
  const regex = new RegExp(
    `logger(?:\\$\\d+)?\\?\\.(?:${methodPattern})\\(|logger(?:\\$\\d+)?\\.(?:${methodPattern})\\(`,
    "g",
  );

  let result = "";
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(code)) !== null) {
    const startIndex = match.index;
    const openParenIndex = startIndex + match[0].length - 1;

    // Find the matching closing parenthesis
    let depth = 1;
    let i = openParenIndex + 1;
    let inString = false;
    let stringChar = "";
    let inTemplate = false;
    let templateDepth = 0;

    while (i < code.length && depth > 0) {
      const char = code[i];
      const prevChar = code[i - 1];

      // Handle string literals
      if (
        !inString && !inTemplate &&
        (char === '"' || char === "'" || char === "`")
      ) {
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
      // Append code before this log call
      result += code.slice(lastIndex, startIndex);

      // Check if this is an arrow function body (=> logger.xxx(...))
      // Look back for "=> " or "=>" pattern
      const beforeLog = result.slice(-20); // Check last 20 chars
      const isArrowFnBody = /=>\s*$/.test(beforeLog);

      if (isArrowFnBody) {
        // Replace with empty block for arrow function
        result += "{}";
      }

      // Skip the log call, also consume trailing semicolon and newline if present
      let endIndex = i;
      if (code[endIndex] === ";") endIndex++;
      if (code[endIndex] === "\n") endIndex++;

      lastIndex = endIndex;
      regex.lastIndex = endIndex;
    }
  }

  // Append remaining code
  result += code.slice(lastIndex);
  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// Production Cleanup Plugin
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Production optimization plugin
 * Removes unnecessary code patterns from the final bundle:
 * - Empty module namespace objects (Object.freeze + defineProperty + Symbol.toStringTag)
 * - /*#__PURE__*​/ annotations (not needed without minification)
 * - Debug/info log calls (significant string savings)
 * - Unused variable declarations
 */
function productionCleanupPlugin(): Plugin {
  return {
    name: "production-cleanup",
    apply: "build",
    enforce: "post",

    generateBundle(_options, bundle) {
      for (const chunk of Object.values(bundle)) {
        if (chunk.type !== "chunk") continue;

        let code = chunk.code;

        // 1. Remove empty module namespace objects
        code = code.replace(
          /const\s+\w+\s*=\s*(?:\/\*#__PURE__\*\/\s*)?Object\.freeze\(\s*(?:\/\*#__PURE__\*\/\s*)?Object\.defineProperty\(\s*\{\s*__proto__\s*:\s*null\s*\}\s*,\s*Symbol\.toStringTag\s*,\s*\{\s*value\s*:\s*['"]Module['"]\s*\}\s*\)\s*\)\s*;?\n?/g,
          "",
        );

        // 2. Remove /*#__PURE__*/ annotations
        code = code.replace(/\/\*#__PURE__\*\/\s*/g, "");

        // 3. Remove standalone Object.freeze({__proto__: null}) patterns
        code = code.replace(
          /Object\.freeze\(\s*\{\s*__proto__\s*:\s*null\s*\}\s*\)/g,
          "({})",
        );

        // 4. Remove debug/info log calls using balanced parentheses matching
        // These are development-only logs that can add significant string content
        code = removeLogCalls(code, ["debug", "info"]);

        // 5. Simplify createSingleton pattern (remove reset() method for production)
        // Pattern: { get() { ... }, reset() { instance = null; } }
        // Replace with: { get() { ... } }
        code = code.replace(
          /,\s*reset\(\)\s*\{\s*instance\s*=\s*null;\s*\}/g,
          "",
        );

        // 6. Remove static resetForTests methods (test-only)
        code = code.replace(
          /static\s+resetForTests\(\)\s*\{[^}]*\}/g,
          "",
        );

        // 7. Remove IIFE exports (userscript doesn't need external API)
        // Pattern: exports.xxx=xxx; or exports.xxx = xxx;
        code = code.replace(
          /exports\.[a-zA-Z_$][a-zA-Z0-9_$]*\s*=\s*[^;]+;/g,
          "",
        );
        // Remove __esModule marker
        code = code.replace(
          /Object\.defineProperty\(exports,['"]__esModule['"],\{value:true\}\);?/g,
          "",
        );

        // 8. Remove @internal JSDoc comments (test-only markers)
        // Single-line: /** @internal */ or /** @internal Test helper */
        code = code.replace(/\s*\/\*\*\s*@internal[^*]*\*\/\s*/g, "\n");
        // Multi-line JSDoc blocks that ONLY contain @internal (no other meaningful content)
        // This matches blocks like:
        // /**
        //  * Reset singleton instance (for testing only)
        //  * @internal
        //  */
        code = code.replace(
          /\s*\/\*\*\s*\n\s*\*[^@]*@internal\s*\n\s*\*\/\s*/g,
          "\n",
        );

        // 9. Remove lines that only contain whitespace (indented empty lines)
        code = code.replace(/^[ \t]+$/gm, "");

        // 10. Clean up multiple consecutive empty lines
        code = code.replace(/\n{3,}/g, "\n\n");

        chunk.code = code;
      }
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Path Aliases
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build path aliases for Vite resolve configuration
 */
function buildPathAliases(root: string): Record<string, string> {
  return Object.fromEntries(
    Object.entries(PATH_ALIASES).map((
      [alias, path],
    ) => [alias, resolve(root, path)]),
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Vite Configuration
// ─────────────────────────────────────────────────────────────────────────────

export default defineConfig(({ mode }): UserConfig => {
  const isDev = mode === "development";
  const config = getBuildModeConfig(mode);
  const outputFileName = isDev ? OUTPUT_FILE_NAMES.dev : OUTPUT_FILE_NAMES.prod;
  const root = process.cwd();

  return {
    plugins: [
      solidPlugin(),
      cssInlinePlugin(mode),
      // Production: Remove empty module namespace objects and cleanup
      ...(!isDev ? [productionCleanupPlugin()] : []),
    ],
    root,

    resolve: {
      alias: buildPathAliases(root),
    },

    build: {
      target: "esnext",
      minify: false, // Keep readable for Greasy Fork policy
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
        cssFileName: "style",
      },

      rollupOptions: {
        output: {
          entryFileNames: outputFileName,
          inlineDynamicImports: true,
          exports: "named",
          // Production optimizations
          ...(!isDev && {
          }),
        },
        // Tree-shake more aggressively in production
        treeshake: isDev ? false : {
          moduleSideEffects: false,
          propertyReadSideEffects: false,
          tryCatchDeoptimization: false,
          unknownGlobalSideEffects: false,
        },
      },
    },

    css: {
      modules: {
        generateScopedName: config.cssClassNamePattern,
        localsConvention: "camelCaseOnly",
        scopeBehaviour: "local",
      },
      devSourcemap: isDev,
    },

    define: {
      __DEV__: JSON.stringify(isDev),
      "import.meta.env.MODE": JSON.stringify(mode),
      "import.meta.env.DEV": JSON.stringify(isDev),
      "import.meta.env.PROD": JSON.stringify(!isDev),
    },

    logLevel: "warn",
  };
});

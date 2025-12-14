/**
 * Vite Configuration for X.com Enhanced Gallery Userscript
 *
 * This configuration handles the complete build pipeline:
 * - Vite bundling with Solid.js
 * - CSS processing and inlining
 * - Userscript metadata generation
 * - Third-party license aggregation
 * - Quality checks (type checking, linting)
 *
 * Build modes:
 *   pnpm build          - Production build with quality checks
 *   pnpm build:dev      - Development build with quality checks
 *   pnpm build:fast     - Production build without quality checks
 *   pnpm build:dev:fast - Development build without quality checks
 */

import { execSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { resolve } from "node:path";
import { defineConfig, type Plugin, type UserConfig } from "vite";
import solidPlugin from "vite-plugin-solid";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const STYLE_ID = "xeg-injected-styles" as const;
const LICENSES_DIR = "./LICENSES";

const OUTPUT_FILE_NAMES = {
  dev: "xcom-enhanced-gallery.dev.user.js",
  prod: "xcom-enhanced-gallery.user.js",
  meta: "xcom-enhanced-gallery.meta.js",
} as const;

const CDN_BASE_URL = "https://cdn.jsdelivr.net/gh/PiesP/xcom-enhanced-gallery@release/dist" as const;

const BROWSER_COMPATIBILITY = {
  chrome: "117",
  firefox: "119",
  edge: "117",
  safari: "17",
} as const;

const PATH_ALIASES = {
  "@": "src",
  "@bootstrap": "src/bootstrap",
  "@constants": "src/constants",
  "@features": "src/features",
  "@shared": "src/shared",
  "@styles": "src/styles",
  "@types": "src/types",
} as const;

const USERSCRIPT_CONFIG = {
  name: "X.com Enhanced Gallery",
  namespace: "https://github.com/PiesP/xcom-enhanced-gallery",
  description: "Media viewer and download functionality for X.com",
  author: "PiesP",
  license: "MIT",
  match: ["https://*.x.com/*"],
  grant: [
    "GM_setValue",
    "GM_getValue",
    "GM_download",
    "GM_notification",
    "GM_xmlhttpRequest",
  ],
  connect: ["pbs.twimg.com", "video.twimg.com", "api.twitter.com"],
  runAt: "document-idle" as const,
  supportURL: "https://github.com/PiesP/xcom-enhanced-gallery/issues",
  homepageURL: "https://github.com/PiesP/xcom-enhanced-gallery",
  icon: "https://abs.twimg.com/favicons/twitter.3.ico",
  noframes: true,
  compatible: BROWSER_COMPATIBILITY,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface BuildModeConfig {
  readonly cssCompress: boolean;
  readonly cssRemoveComments: boolean;
  readonly cssVariableShortening: boolean;
  readonly cssValueMinify: boolean;
  readonly cssClassNamePattern: string;
  readonly sourceMap: boolean | "inline";
}

interface LicenseInfo {
  readonly name: string;
  readonly text: string;
}

interface UserscriptMeta {
  readonly name: string;
  readonly namespace: string;
  readonly version: string;
  readonly description: string;
  readonly author: string;
  readonly license: string;
  readonly match: readonly string[];
  readonly grant: readonly string[];
  readonly connect: readonly string[];
  readonly runAt: "document-start" | "document-end" | "document-idle";
  readonly supportURL: string;
  readonly homepageURL?: string;
  readonly downloadURL: string;
  readonly updateURL: string;
  readonly noframes: boolean;
  readonly icon?: string;
  readonly require?: readonly string[];
  readonly compatible?: Record<string, string>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Build Mode Configuration
// ─────────────────────────────────────────────────────────────────────────────

const BUILD_MODE_CONFIGS: Record<"development" | "production", BuildModeConfig> =
  {
    development: {
      cssCompress: false,
      cssRemoveComments: false,
      cssVariableShortening: false,
      cssValueMinify: false,
      cssClassNamePattern: "[name]__[local]__[hash:base64:5]",
      sourceMap: true as const,
    },
    production: {
      cssCompress: true,
      cssRemoveComments: true,
      cssVariableShortening: true,
      cssValueMinify: true,
      cssClassNamePattern: "xeg_[hash:base64:6]",
      sourceMap: false as const,
    },
  };

function getBuildModeConfig(mode: string): BuildModeConfig {
  return BUILD_MODE_CONFIGS[
    mode === "development" ? "development" : "production"
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// Version Resolution
// ─────────────────────────────────────────────────────────────────────────────

function getVersionFromGit(): string | null {
  try {
    const stdout = execSync("git describe --tags --abbrev=0", {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "ignore"],
    }).trim();
    return stdout.startsWith("v") ? stdout.slice(1) : stdout;
  } catch {
    return null;
  }
}

function getGitCommitShort(): string | null {
  try {
    return execSync("git rev-parse --short HEAD", {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "ignore"],
    }).trim();
  } catch {
    return null;
  }
}

function resolveVersion(isDev: boolean): string {
  const envVersion = process.env.BUILD_VERSION;
  if (envVersion) return envVersion;

  const gitVersion = getVersionFromGit();
  const baseVersion = gitVersion ?? (isDev ? "0.0.0" : "1.0.0");

  if (isDev) {
    const commit = getGitCommitShort() ?? "unknown";
    return `${baseVersion}-dev.${commit}`;
  }

  return baseVersion;
}

// ─────────────────────────────────────────────────────────────────────────────
// License Aggregation
// ─────────────────────────────────────────────────────────────────────────────

const LICENSE_NAME_MAP: Record<string, string> = {
  "solid-js": "Solid.js",
  heroicons: "Heroicons",
  "xcom-enhanced-gallery": "X.com Enhanced Gallery",
};

const MIT_LICENSE_BODY = `Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`;

function parseLicenseName(filename: string): string {
  const base = filename
    .replace(/\.(txt|md)$/i, "")
    .replace(/-(MIT|LICENSE|APACHE|BSD)$/i, "");
  return LICENSE_NAME_MAP[base] ?? base;
}

function aggregateLicenses(licensesDir: string): LicenseInfo[] {
  try {
    const entries = fs.readdirSync(licensesDir);
    const validExtensions = new Set([".txt", ".md"]);
    const excludePattern = /xcom-enhanced-gallery/i;

    return entries
      .filter((entry) => {
        const ext = path.extname(entry).toLowerCase();
        return (
          validExtensions.has(ext) &&
          !excludePattern.test(entry) &&
          fs.statSync(path.join(licensesDir, entry)).isFile()
        );
      })
      .map((filename) => {
        const content = fs.readFileSync(
          path.join(licensesDir, filename),
          "utf8"
        );
        return { name: parseLicenseName(filename), text: content.trim() };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch {
    return [];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Userscript Metadata Generation
// ─────────────────────────────────────────────────────────────────────────────

function formatMetaLine(key: string, value: string): string {
  return `// @${key.padEnd(12)} ${value}`;
}

function formatMetaLines(key: string, values: readonly string[]): string[] {
  return values.map((v) => formatMetaLine(key, v));
}

function buildMetadataBlock(config: UserscriptMeta): string {
  const lines = [
    "// ==UserScript==",
    formatMetaLine("name", config.name),
    formatMetaLine("namespace", config.namespace),
    formatMetaLine("version", config.version),
    formatMetaLine("description", config.description),
    formatMetaLine("author", config.author),
    formatMetaLine("license", config.license),
    ...(config.homepageURL ? [formatMetaLine("homepageURL", config.homepageURL)] : []),
    ...formatMetaLines("match", config.match),
    ...formatMetaLines("grant", config.grant),
    ...formatMetaLines("connect", config.connect),
    formatMetaLine("run-at", config.runAt),
    formatMetaLine("supportURL", config.supportURL),
    formatMetaLine("downloadURL", config.downloadURL),
    formatMetaLine("updateURL", config.updateURL),
    ...(config.icon ? [formatMetaLine("icon", config.icon)] : []),
    ...(config.compatible ? Object.entries(config.compatible).map(
      ([browser, version]) => formatMetaLine("compatible", `${browser} ${version}+`)
    ) : []),
    ...(config.require?.length
      ? formatMetaLines("require", config.require)
      : []),
    ...(config.noframes ? ["// @noframes"] : []),
    "// ==/UserScript==",
  ];
  return lines.join("\n");
}

function buildLicenseBlock(licenses: readonly LicenseInfo[]): string {
  if (licenses.length === 0) return "";

  const mitCopyrights: Array<{ name: string; copyright: string }> = [];
  const otherLicenses: LicenseInfo[] = [];

  for (const license of licenses) {
    const isMit =
      license.text.includes("MIT License") ||
      license.text.includes("Permission is hereby granted");
    if (isMit) {
      const match = license.text.match(/Copyright\s*\(c\)\s*(.+)/i);
      if (match?.[1]) {
        mitCopyrights.push({ name: license.name, copyright: match[1].trim() });
        continue;
      }
    }
    otherLicenses.push(license);
  }

  const lines = [" * Third-Party Licenses", " * ====================", " *"];

  if (mitCopyrights.length > 0) {
    lines.push(" * MIT License", " *");
    for (const { name, copyright } of mitCopyrights) {
      lines.push(` * Copyright (c) ${copyright} (${name})`);
    }
    lines.push(" *");
    for (const textLine of MIT_LICENSE_BODY.split("\n")) {
      lines.push(` * ${textLine}`);
    }
    if (otherLicenses.length > 0) lines.push(" *", " *");
  }

  for (let i = 0; i < otherLicenses.length; i++) {
    const license = otherLicenses[i];
    if (!license) continue;
    lines.push(` * ${license.name}:`);
    for (const textLine of license.text.split("\n")) {
      lines.push(` * ${textLine}`);
    }
    if (i < otherLicenses.length - 1) lines.push(" *", " *");
  }

  lines.push(" *");
  return ["/*", ...lines, " */"].join("\n");
}

function generateUserscriptHeader(version: string, isDev: boolean): string {
  const fileName = isDev ? OUTPUT_FILE_NAMES.dev : OUTPUT_FILE_NAMES.prod;
  const metaFileName = OUTPUT_FILE_NAMES.meta;

  const nameSuffix = isDev ? " (Dev)" : "";

  const config: UserscriptMeta = {
    ...USERSCRIPT_CONFIG,
    name: `${USERSCRIPT_CONFIG.name}${nameSuffix}`,
    version,
    homepageURL: USERSCRIPT_CONFIG.homepageURL,
    downloadURL: `${CDN_BASE_URL}/${fileName}`,
    updateURL: `${CDN_BASE_URL}/${metaFileName}`,
    compatible: USERSCRIPT_CONFIG.compatible,
  };

  const licenses = aggregateLicenses(LICENSES_DIR);
  const metaBlock = buildMetadataBlock(config);
  const licenseBlock = buildLicenseBlock(licenses);

  return licenseBlock ? `${metaBlock}\n${licenseBlock}` : metaBlock;
}

function generateMetaOnlyHeader(version: string): string {
  const fileName = OUTPUT_FILE_NAMES.prod;
  const metaFileName = OUTPUT_FILE_NAMES.meta;

  const lines = [
    "// ==UserScript==",
    formatMetaLine("name", USERSCRIPT_CONFIG.name),
    formatMetaLine("namespace", USERSCRIPT_CONFIG.namespace),
    formatMetaLine("version", version),
    formatMetaLine("downloadURL", `${CDN_BASE_URL}/${fileName}`),
    formatMetaLine("updateURL", `${CDN_BASE_URL}/${metaFileName}`),
    "// ==/UserScript==",
  ];

  return lines.join("\n");
}

// ─────────────────────────────────────────────────────────────────────────────
// CSS Processing Utilities
// ─────────────────────────────────────────────────────────────────────────────

function removeCssComments(css: string): string {
  let result = "";
  let i = 0;
  let inString = false;
  let stringChar = "";

  while (i < css.length) {
    if (!inString && (css[i] === '"' || css[i] === "'")) {
      inString = true;
      stringChar = css[i] as string;
      result += css[i];
      i++;
      continue;
    }

    if (inString && css[i] === stringChar && css[i - 1] !== "\\") {
      inString = false;
      result += css[i];
      i++;
      continue;
    }

    if (inString) {
      result += css[i];
      i++;
      continue;
    }

    if (css[i] === "/" && css[i + 1] === "*") {
      const commentEnd = css.indexOf("*/", i + 2);
      if (commentEnd === -1) break;
      i = commentEnd + 2;
      if (
        result.length > 0 &&
        result[result.length - 1] !== " " &&
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

const CSS_VAR_SHORTENING_MAP: Record<string, string> = {
  "--xeg-ease-standard": "--xe-s",
  "--xeg-ease-decelerate": "--xe-d",
  "--xeg-ease-accelerate": "--xe-a",
  "--xeg-ease-entrance": "--xe-e",
  "--xeg-easing-ease-out": "--xeo",
  "--xeg-easing-ease-in": "--xei",
  "--xeg-easing-linear": "--xel",
  "--xeg-duration": "--xd",
  "--xeg-duration-fast": "--xdf",
  "--xeg-duration-normal": "--xdn",
  "--xeg-duration-slow": "--xds",
  "--xeg-duration-toolbar": "--xdt",
  "--xeg-transition-interaction-fast": "--xti",
  "--xeg-transition-surface-fast": "--xts",
  "--xeg-transition-surface-normal": "--xtsn",
  "--xeg-transition-elevation-fast": "--xtef",
  "--xeg-transition-elevation-normal": "--xten",
  "--xeg-transition-width-normal": "--xtwn",
  "--xeg-transition-opacity": "--xto",
  "--xeg-transition-toolbar": "--xtt",
  "--xeg-color-text-primary": "--xct-p",
  "--xeg-color-text-secondary": "--xct-s",
  "--xeg-color-text-tertiary": "--xct-t",
  "--xeg-color-text-inverse": "--xct-i",
  "--xeg-color-border-primary": "--xcb-p",
  "--xeg-color-border-hover": "--xcb-h",
  "--xeg-color-border-strong": "--xcb-s",
  "--xeg-color-bg-primary": "--xcbg-p",
  "--xeg-color-bg-secondary": "--xcbg-s",
  "--xeg-color-primary": "--xc-p",
  "--xeg-color-primary-hover": "--xc-ph",
  "--xeg-color-success": "--xc-s",
  "--xeg-color-success-hover": "--xc-sh",
  "--xeg-color-error": "--xc-e",
  "--xeg-color-error-hover": "--xc-eh",
  "--xeg-color-overlay-medium": "--xc-om",
  "--xeg-color-surface-elevated": "--xc-se",
  "--xeg-color-background": "--xc-bg",
  "--xeg-color-neutral-100": "--xcn1",
  "--xeg-color-neutral-200": "--xcn2",
  "--xeg-color-neutral-300": "--xcn3",
  "--xeg-color-neutral-400": "--xcn4",
  "--xeg-color-neutral-500": "--xcn5",
  "--xeg-spacing-xs": "--xs-xs",
  "--xeg-spacing-sm": "--xs-s",
  "--xeg-spacing-md": "--xs-m",
  "--xeg-spacing-lg": "--xs-l",
  "--xeg-spacing-xl": "--xs-xl",
  "--xeg-spacing-2xl": "--xs-2",
  "--xeg-spacing-3xl": "--xs-3",
  "--xeg-spacing-5xl": "--xs-5",
  "--xeg-radius-xs": "--xr-xs",
  "--xeg-radius-sm": "--xr-s",
  "--xeg-radius-md": "--xr-m",
  "--xeg-radius-lg": "--xr-l",
  "--xeg-radius-xl": "--xr-xl",
  "--xeg-radius-2xl": "--xr-2",
  "--xeg-radius-full": "--xr-f",
  "--xeg-font-size-sm": "--xfs-s",
  "--xeg-font-size-base": "--xfs-b",
  "--xeg-font-size-md": "--xfs-m",
  "--xeg-font-size-lg": "--xfs-l",
  "--xeg-font-size-2xl": "--xfs-2",
  "--xeg-font-weight-medium": "--xfw-m",
  "--xeg-font-weight-semibold": "--xfw-s",
  "--xeg-font-family-ui": "--xff-u",
  "--xeg-line-height-normal": "--xlh",
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
  "--xeg-button-lift": "--xb-l",
  "--xeg-button-bg": "--xb-bg",
  "--xeg-button-border": "--xb-b",
  "--xeg-button-text": "--xb-t",
  "--xeg-button-bg-hover": "--xb-bgh",
  "--xeg-button-border-hover": "--xb-bh",
  "--xeg-button-disabled-opacity": "--xb-do",
  "--xeg-button-square-size": "--xb-ss",
  "--xeg-button-square-padding": "--xb-sp",
  "--xeg-size-button-sm": "--xsb-s",
  "--xeg-size-button-md": "--xsb-m",
  "--xeg-size-button-lg": "--xsb-l",
  "--xeg-surface-bg": "--xsu-b",
  "--xeg-surface-border": "--xsu-br",
  "--xeg-surface-bg-hover": "--xsu-bh",
  "--xeg-gallery-bg": "--xg-b",
  "--xeg-gallery-bg-light": "--xg-bl",
  "--xeg-gallery-bg-dark": "--xg-bd",
  "--xeg-modal-bg": "--xm-b",
  "--xeg-modal-border": "--xm-br",
  "--xeg-modal-bg-light": "--xm-bl",
  "--xeg-modal-bg-dark": "--xm-bd",
  "--xeg-modal-border-light": "--xm-brl",
  "--xeg-modal-border-dark": "--xm-brd",
  "--xeg-spinner-size": "--xsp-s",
  "--xeg-spinner-size-default": "--xsp-sd",
  "--xeg-spinner-border-width": "--xsp-bw",
  "--xeg-spinner-track-color": "--xsp-tc",
  "--xeg-spinner-indicator-color": "--xsp-ic",
  "--xeg-spinner-duration": "--xsp-d",
  "--xeg-spinner-easing": "--xsp-e",
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
  "--xeg-settings-gap": "--xse-g",
  "--xeg-settings-padding": "--xse-p",
  "--xeg-settings-control-gap": "--xse-cg",
  "--xeg-settings-label-font-size": "--xse-lf",
  "--xeg-settings-label-font-weight": "--xse-lw",
  "--xeg-settings-select-font-size": "--xse-sf",
  "--xeg-settings-select-padding": "--xse-sp",
  "--xeg-gallery-item-intrinsic-width": "--xgi-w",
  "--xeg-gallery-item-intrinsic-height": "--xgi-h",
  "--xeg-gallery-item-intrinsic-ratio": "--xgi-r",
  "--xeg-gallery-fit-height-target": "--xgf-ht",
};

function shortenCssVariables(css: string): string {
  let result = css;
  const sortedEntries = Object.entries(CSS_VAR_SHORTENING_MAP).sort(
    (a, b) => b[0].length - a[0].length
  );

  for (const [longName, shortName] of sortedEntries) {
    const escapedLong = longName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    result = result.replace(new RegExp(escapedLong, "g"), shortName);
  }

  return result;
}

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

function processCss(css: string, config: BuildModeConfig): string {
  let result = css;
  if (config.cssRemoveComments) result = removeCssComments(result);
  if (config.cssVariableShortening) result = shortenCssVariables(result);
  if (config.cssValueMinify) result = compressCssValues(result);
  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// CSS Inline Plugin
// ─────────────────────────────────────────────────────────────────────────────

function cssInlinePlugin(mode: string): Plugin {
  const isDev = mode === "development";
  const config = getBuildModeConfig(mode);

  return {
    name: "css-inline",
    apply: "build",
    enforce: "post",

    generateBundle(_options, bundle) {
      const cssChunks: string[] = [];

      for (const [fileName, asset] of Object.entries(bundle)) {
        if (!fileName.endsWith(".css") || asset.type !== "asset") continue;

        const { source } = asset as { source?: string | Uint8Array };
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

      const css = cssChunks.join(config.cssCompress ? "" : "\n");
      if (!css.trim()) return;

      const injectionCode = `
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

      for (const chunk of Object.values(bundle)) {
        if (chunk.type === "chunk" && chunk.isEntry) {
          chunk.code = injectionCode + chunk.code;
          break;
        }
      }
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Log Call Removal Utility
// ─────────────────────────────────────────────────────────────────────────────

function removeLogCalls(code: string, methods: string[]): string {
  const methodPattern = methods.join("|");
  const regex = new RegExp(
    `logger(?:\\$\\d+)?\\?\\.(?:${methodPattern})\\(|logger(?:\\$\\d+)?\\.(?:${methodPattern})\\(`,
    "g"
  );

  let result = "";
  let lastIndex = 0;
  let match: RegExpExecArray | null;

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

      if (
        !inString &&
        !inTemplate &&
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
      // Preserve code before the logger call
      result += code.slice(lastIndex, startIndex);

      // Replace the logger call with a harmless no-op to keep control-flow intact
      // This avoids generating invalid constructs like `else }` when the call was
      // the sole statement in an if/else branch.
      result += "void 0";

      // Preserve trailing semicolons and whitespace
      let endIndex = i;
      if (code[endIndex] === ";") {
        result += ";";
        endIndex++;
      }
      while (code[endIndex] === "\n" || code[endIndex] === "\r" || code[endIndex] === "\t" || code[endIndex] === " ") {
        result += code[endIndex];
        endIndex++;
      }

      lastIndex = endIndex;
      regex.lastIndex = endIndex;
    }
  }

  result += code.slice(lastIndex);
  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// Production Cleanup Plugin
// ─────────────────────────────────────────────────────────────────────────────

function productionCleanupPlugin(): Plugin {
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
        code = code.replace(/static\s+resetForTests\(\)\s*\{[^}]*\}/g, "");
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
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Userscript Header Plugin
// ─────────────────────────────────────────────────────────────────────────────

function userscriptHeaderPlugin(mode: string): Plugin {
  const isDev = mode === "development";
  const version = resolveVersion(isDev);

  return {
    name: "userscript-header",
    apply: "build",
    enforce: "post",

    generateBundle(_options, bundle) {
      const header = generateUserscriptHeader(version, isDev);

      for (const chunk of Object.values(bundle)) {
        if (chunk.type === "chunk" && chunk.isEntry) {
          chunk.code = `${header}\n${chunk.code}`;
          break;
        }
      }
    },

    closeBundle() {
      const modeLabel = isDev ? "Development" : "Production";
      const info = isDev
        ? [
            "📖 Optimized for: Debugging & Analysis",
            "├─ CSS class names: Readable (Component__class__hash)",
            "├─ CSS formatting: Preserved",
            "├─ CSS variables: Full names (--xeg-*)",
            "├─ CSS comments: Preserved",
            "└─ Source maps: Inline",
          ]
        : [
            "📦 Optimized for: Distribution Size",
            "├─ CSS class names: Hashed (xeg_*)",
            "├─ CSS formatting: Compressed",
            "├─ CSS variables: Shortened",
            "├─ CSS comments: Removed",
            "└─ Source maps: Disabled",
          ];

      console.log(`\n📋 Build Mode: ${modeLabel}`);
      console.log("─".repeat(50));
      info.forEach((line) => console.log(`   ${line}`));
      console.log("─".repeat(50));
      console.log(`📌 Version: ${version}`);
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Meta-Only File Plugin
// ─────────────────────────────────────────────────────────────────────────────

function metaOnlyPlugin(mode: string): Plugin {
  const isDev = mode === "development";
  const version = resolveVersion(isDev);
  // Only generate meta.js for production builds
  const shouldGenerateMeta = !isDev;

  return {
    name: "meta-only-file",
    apply: "build",
    enforce: "post",

    writeBundle(options) {
      if (!shouldGenerateMeta) return;

      const outDir = options.dir ?? "dist";
      const metaContent = generateMetaOnlyHeader(version);
      const metaPath = path.join(outDir, OUTPUT_FILE_NAMES.meta);

      fs.writeFileSync(metaPath, metaContent, "utf8");
      console.log(`📄 Meta-only file generated: ${OUTPUT_FILE_NAMES.meta}`);
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Dist Cleanup Plugin
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Allowed output files in the dist directory.
 * Files not in this list will be removed during build.
 */
const ALLOWED_OUTPUT_FILES = new Set([
  OUTPUT_FILE_NAMES.dev,
  `${OUTPUT_FILE_NAMES.dev}.map`,
  OUTPUT_FILE_NAMES.prod,
  OUTPUT_FILE_NAMES.meta,
]);

function distCleanupPlugin(): Plugin {
  return {
    name: "dist-cleanup",
    apply: "build",
    enforce: "pre",

    buildStart() {
      const distDir = resolve(process.cwd(), "dist");

      if (!fs.existsSync(distDir)) {
        fs.mkdirSync(distDir, { recursive: true });
        return;
      }

      const files = fs.readdirSync(distDir);
      for (const file of files) {
        if (!ALLOWED_OUTPUT_FILES.has(file)) {
          const filePath = path.join(distDir, file);
          fs.rmSync(filePath, { recursive: true, force: true });
          console.log(`🗑️  Removed: ${file}`);
        }
      }
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Path Aliases
// ─────────────────────────────────────────────────────────────────────────────

function buildPathAliases(root: string): Record<string, string> {
  return Object.fromEntries(
    Object.entries(PATH_ALIASES).map(([alias, aliasPath]) => [
      alias,
      resolve(root, aliasPath),
    ])
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Vite Configuration
// ─────────────────────────────────────────────────────────────────────────────

export default defineConfig(({ mode }): UserConfig => {
  const isDev = mode === "development";
  const config = getBuildModeConfig(mode);
  const outputFileName = isDev
    ? OUTPUT_FILE_NAMES.dev
    : OUTPUT_FILE_NAMES.prod;
  const root = process.cwd();

  return {
    plugins: [
      distCleanupPlugin(),
      solidPlugin(),
      cssInlinePlugin(mode),
      userscriptHeaderPlugin(mode),
      metaOnlyPlugin(mode),
      ...(!isDev ? [productionCleanupPlugin()] : []),
    ],
    root,

    resolve: {
      alias: buildPathAliases(root),
    },

    build: {
      target: "esnext",
      minify: false,
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
        },
        treeshake: isDev
          ? false
          : {
              moduleSideEffects: false,
              propertyReadSideEffects: false,
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

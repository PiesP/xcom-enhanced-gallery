import type { Plugin } from 'vite';
import { getBuildModeConfig } from '../build-mode';
import { STYLE_ID } from '../constants';
import type { BuildModeConfig } from '../types';

function removeCssComments(css: string): string {
  let result = '';
  let i = 0;
  let inString = false;
  let stringChar = '';

  while (i < css.length) {
    if (!inString && (css[i] === '"' || css[i] === "'")) {
      inString = true;
      stringChar = css[i] as string;
      result += css[i];
      i++;
      continue;
    }

    if (inString && css[i] === stringChar && css[i - 1] !== '\\') {
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

    if (css[i] === '/' && css[i + 1] === '*') {
      const commentEnd = css.indexOf('*/', i + 2);
      if (commentEnd === -1) break;
      i = commentEnd + 2;
      if (
        result.length > 0 &&
        result[result.length - 1] !== ' ' &&
        result[result.length - 1] !== '\n'
      ) {
        result += ' ';
      }
      continue;
    }

    result += css[i];
    i++;
  }

  return result
    .replace(/ {2,}/g, ' ')
    .replace(/\n\s*\n/g, '\n')
    .replace(/^\s+/gm, '')
    .replace(/\s+$/gm, '')
    .trim();
}

const CSS_VAR_SHORTENING_MAP: Record<string, string> = {
  '--xeg-ease-standard': '--xe-s',
  '--xeg-ease-decelerate': '--xe-d',
  '--xeg-ease-accelerate': '--xe-a',
  '--xeg-ease-entrance': '--xe-e',
  '--xeg-easing-ease-out': '--xeo',
  '--xeg-easing-ease-in': '--xei',
  '--xeg-easing-linear': '--xel',
  '--xeg-duration': '--xd',
  '--xeg-duration-fast': '--xdf',
  '--xeg-duration-normal': '--xdn',
  '--xeg-duration-slow': '--xds',
  '--xeg-duration-toolbar': '--xdt',
  '--xeg-transition-interaction-fast': '--xti',
  '--xeg-transition-surface-fast': '--xts',
  '--xeg-transition-surface-normal': '--xtsn',
  '--xeg-transition-elevation-fast': '--xtef',
  '--xeg-transition-elevation-normal': '--xten',
  '--xeg-transition-width-normal': '--xtwn',
  '--xeg-transition-opacity': '--xto',
  '--xeg-transition-toolbar': '--xtt',
  '--xeg-color-text-primary': '--xct-p',
  '--xeg-color-text-secondary': '--xct-s',
  '--xeg-color-text-tertiary': '--xct-t',
  '--xeg-color-text-inverse': '--xct-i',
  '--xeg-color-border-primary': '--xcb-p',
  '--xeg-color-border-hover': '--xcb-h',
  '--xeg-color-border-strong': '--xcb-s',
  '--xeg-color-bg-primary': '--xcbg-p',
  '--xeg-color-bg-secondary': '--xcbg-s',
  '--xeg-color-primary': '--xc-p',
  '--xeg-color-primary-hover': '--xc-ph',
  '--xeg-color-success': '--xc-s',
  '--xeg-color-success-hover': '--xc-sh',
  '--xeg-color-error': '--xc-e',
  '--xeg-color-error-hover': '--xc-eh',
  '--xeg-color-overlay-medium': '--xc-om',
  '--xeg-color-surface-elevated': '--xc-se',
  '--xeg-color-background': '--xc-bg',
  '--xeg-color-neutral-100': '--xcn1',
  '--xeg-color-neutral-200': '--xcn2',
  '--xeg-color-neutral-300': '--xcn3',
  '--xeg-color-neutral-400': '--xcn4',
  '--xeg-color-neutral-500': '--xcn5',
  '--xeg-spacing-xs': '--xs-xs',
  '--xeg-spacing-sm': '--xs-s',
  '--xeg-spacing-md': '--xs-m',
  '--xeg-spacing-lg': '--xs-l',
  '--xeg-spacing-xl': '--xs-xl',
  '--xeg-spacing-2xl': '--xs-2',
  '--xeg-spacing-3xl': '--xs-3',
  '--xeg-spacing-5xl': '--xs-5',
  '--xeg-radius-xs': '--xr-xs',
  '--xeg-radius-sm': '--xr-s',
  '--xeg-radius-md': '--xr-m',
  '--xeg-radius-lg': '--xr-l',
  '--xeg-radius-xl': '--xr-xl',
  '--xeg-radius-2xl': '--xr-2',
  '--xeg-radius-full': '--xr-f',
  '--xeg-font-size-sm': '--xfs-s',
  '--xeg-font-size-base': '--xfs-b',
  '--xeg-font-size-md': '--xfs-m',
  '--xeg-font-size-lg': '--xfs-l',
  '--xeg-font-size-2xl': '--xfs-2',
  '--xeg-font-weight-medium': '--xfw-m',
  '--xeg-font-weight-semibold': '--xfw-s',
  '--xeg-font-family-ui': '--xff-u',
  '--xeg-line-height-normal': '--xlh',
  '--xeg-z-gallery': '--xz-g',
  '--xeg-z-gallery-overlay': '--xz-go',
  '--xeg-z-gallery-toolbar': '--xz-gt',
  '--xeg-z-toolbar': '--xz-t',
  '--xeg-z-toolbar-hover-zone': '--xz-th',
  '--xeg-z-toolbar-panel': '--xz-tp',
  '--xeg-z-toolbar-panel-active': '--xz-ta',
  '--xeg-z-overlay': '--xz-o',
  '--xeg-z-modal': '--xz-m',
  '--xeg-z-modal-backdrop': '--xz-mb',
  '--xeg-z-modal-foreground': '--xz-mf',
  '--xeg-z-tooltip': '--xz-tt',
  '--xeg-z-stack-base': '--xz-sb',
  '--xeg-layer-root': '--xlr',
  '--xeg-toolbar-surface': '--xt-s',
  '--xeg-toolbar-border': '--xt-b',
  '--xeg-toolbar-panel-surface': '--xtp-s',
  '--xeg-toolbar-panel-transition': '--xtp-t',
  '--xeg-toolbar-panel-height': '--xtp-h',
  '--xeg-toolbar-panel-max-height': '--xtp-mh',
  '--xeg-toolbar-panel-shadow': '--xtp-sh',
  '--xeg-toolbar-text-color': '--xtt-c',
  '--xeg-toolbar-text-muted': '--xtt-m',
  '--xeg-toolbar-element-bg': '--xte-b',
  '--xeg-toolbar-element-bg-strong': '--xte-bs',
  '--xeg-toolbar-element-border': '--xte-br',
  '--xeg-toolbar-progress-track': '--xtp-pt',
  '--xeg-toolbar-scrollbar-track': '--xts-t',
  '--xeg-toolbar-scrollbar-thumb': '--xts-th',
  '--xeg-toolbar-shadow': '--xt-sh',
  '--xeg-toolbar-hover-zone-bg': '--xth-bg',
  '--xeg-toolbar-hidden-opacity': '--xth-o',
  '--xeg-toolbar-hidden-visibility': '--xth-v',
  '--xeg-toolbar-hidden-pointer-events': '--xth-pe',
  '--xeg-button-lift': '--xb-l',
  '--xeg-button-bg': '--xb-bg',
  '--xeg-button-border': '--xb-b',
  '--xeg-button-text': '--xb-t',
  '--xeg-button-bg-hover': '--xb-bgh',
  '--xeg-button-border-hover': '--xb-bh',
  '--xeg-button-disabled-opacity': '--xb-do',
  '--xeg-button-square-size': '--xb-ss',
  '--xeg-button-square-padding': '--xb-sp',
  '--xeg-size-button-sm': '--xsb-s',
  '--xeg-size-button-md': '--xsb-m',
  '--xeg-size-button-lg': '--xsb-l',
  '--xeg-surface-bg': '--xsu-b',
  '--xeg-surface-border': '--xsu-br',
  '--xeg-surface-bg-hover': '--xsu-bh',
  '--xeg-gallery-bg': '--xg-b',
  '--xeg-gallery-bg-light': '--xg-bl',
  '--xeg-gallery-bg-dark': '--xg-bd',
  '--xeg-modal-bg': '--xm-b',
  '--xeg-modal-border': '--xm-br',
  '--xeg-modal-bg-light': '--xm-bl',
  '--xeg-modal-bg-dark': '--xm-bd',
  '--xeg-modal-border-light': '--xm-brl',
  '--xeg-modal-border-dark': '--xm-brd',
  '--xeg-spinner-size': '--xsp-s',
  '--xeg-spinner-size-default': '--xsp-sd',
  '--xeg-spinner-border-width': '--xsp-bw',
  '--xeg-spinner-track-color': '--xsp-tc',
  '--xeg-spinner-indicator-color': '--xsp-ic',
  '--xeg-spinner-duration': '--xsp-d',
  '--xeg-spinner-easing': '--xsp-e',
  '--xeg-opacity-disabled': '--xo-d',
  '--xeg-hover-lift': '--xhl',
  '--xeg-focus-indicator-color': '--xfic',
  '--xeg-border-emphasis': '--xbe',
  '--xeg-border-button': '--xbb',
  '--xeg-skeleton-bg': '--xsk-b',
  '--xeg-scrollbar-width': '--xsw',
  '--xeg-scrollbar-border-radius': '--xsbr',
  '--xeg-hover-zone-height': '--xhzh',
  '--xeg-icon-size': '--xis',
  '--xeg-icon-stroke-width': '--xisw',
  '--xeg-icon-only-size': '--xios',
  '--xeg-gpu-hack': '--xgh',
  '--xeg-backface-visibility': '--xbv',
  '--xeg-bg-toolbar': '--xbgt',
  '--xeg-glass-border-strong': '--xgbs',
  '--xeg-viewport-height-constrained': '--xvhc',
  '--xeg-aspect-default': '--xad',
  '--xeg-settings-gap': '--xse-g',
  '--xeg-settings-padding': '--xse-p',
  '--xeg-settings-control-gap': '--xse-cg',
  '--xeg-settings-label-font-size': '--xse-lf',
  '--xeg-settings-label-font-weight': '--xse-lw',
  '--xeg-settings-select-font-size': '--xse-sf',
  '--xeg-settings-select-padding': '--xse-sp',
  '--xeg-gallery-item-intrinsic-width': '--xgi-w',
  '--xeg-gallery-item-intrinsic-height': '--xgi-h',
  '--xeg-gallery-item-intrinsic-ratio': '--xgi-r',
  '--xeg-gallery-fit-height-target': '--xgf-ht',

  // Unprefixed design tokens (internal-only). Shortening these reduces CSS size and
  // also avoids leaking generic token names onto :root in production output.
  '--color-base-white': '--cbw',
  '--color-base-black': '--cbb',
  '--color-gray-50': '--cg0',
  '--color-gray-100': '--cg1',
  '--color-gray-200': '--cg2',
  '--color-gray-300': '--cg3',
  '--color-gray-400': '--cg4',
  '--color-gray-500': '--cg5',
  '--color-gray-600': '--cg6',
  '--color-gray-700': '--cg7',
  '--color-gray-800': '--cg8',
  '--color-gray-900': '--cg9',

  '--color-bg-primary': '--cbp',
  '--color-bg-secondary': '--cbs',
  '--color-bg-surface': '--cbu',
  '--color-bg-elevated': '--cbe',
  '--color-text-primary': '--ctp',
  '--color-text-secondary': '--cts',
  '--color-text-muted': '--ctm',
  '--color-text-inverse': '--cti',
  '--color-text-error': '--cte',
  '--color-text-on-overlay': '--cto',
  '--color-border-default': '--cbd',
  '--color-border-muted': '--cbm',
  '--color-border-subtle': '--cbsu',
  '--color-border-emphasis': '--cbe2',
  '--color-border-hover': '--cbh',
  '--color-success': '--cs',
  '--color-success-hover': '--csh',
  '--color-success-bg': '--csb',
  '--color-error': '--ce',
  '--color-error-hover': '--ceh',
  '--color-error-bg': '--ceb',
  '--color-warning': '--cw',
  '--color-warning-bg': '--cwb',
  '--color-info': '--ci',
  '--color-info-bg': '--cib',
  '--color-primary': '--cp',
  '--color-primary-hover': '--cph',
  '--color-primary-active': '--cpa',
  '--color-overlay-medium': '--com',
  '--color-overlay-backdrop': '--cob',

  '--space-xs': '--spx',
  '--space-sm': '--sps',
  '--space-md': '--spm',
  '--space-lg': '--spl',
  '--space-xl': '--spxl',
  '--space-2xl': '--sp2',

  '--radius-xs': '--rx',
  '--radius-sm': '--rs',
  '--radius-md': '--rm',
  '--radius-lg': '--rl',
  '--radius-xl': '--rxl',
  '--radius-2xl': '--r2',
  '--radius-pill': '--rp',
  '--radius-full': '--rf',

  '--font-family-primary': '--ffp',
  '--font-size-2xs': '--fs2x',
  '--font-size-xs': '--fsx',
  '--font-size-sm': '--fss',
  '--font-size-base': '--fsb',
  '--font-size-md': '--fsm',
  '--font-size-lg': '--fsl',
  '--font-size-xl': '--fsxl',
  '--font-size-2xl': '--fs2',
  '--font-size-3xl': '--fs3',
  '--font-weight-normal': '--fwn',
  '--font-weight-medium': '--fwm',
  '--font-weight-semibold': '--fws',
  '--font-weight-bold': '--fwb',
  '--duration-fast': '--df',
  '--duration-normal': '--dn',
  '--duration-slow': '--ds',
  '--transition-fast': '--tf',
  '--transition-normal': '--tn',
  '--transition-slow': '--ts',
  '--border-width-thin': '--bwt',
  '--border-width-sm': '--bws',
  '--opacity-overlay-backdrop': '--oob',
  '--line-height-normal': '--lhn',
  '--size-button-md': '--sbm',
  '--size-icon-md': '--sim',
};

function shortenCssVariables(css: string): string {
  let result = css;
  const sortedEntries = Object.entries(CSS_VAR_SHORTENING_MAP).sort(
    (a, b) => b[0].length - a[0].length
  );

  for (const [longName, shortName] of sortedEntries) {
    const escapedLong = longName.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&');
    result = result.replace(new RegExp(escapedLong, 'g'), shortName);
  }

  return result;
}

function compressCssValues(css: string): string {
  return css
    .replace(/\b0+\.(\d)/g, '.$1')
    .replace(/\b0(px|rem|em|vh|vw|vmin|vmax|ch|ex)\b/g, '0')
    .replace(/\s*:\s*/g, ':')
    .replace(/\s*;\s*/g, ';')
    .replace(/;}/g, '}')
    .replace(/\s*\{/g, '{')
    .replace(/\{\s*/g, '{')
    .replace(/\s*\}/g, '}')
    .replace(/\s+/g, ' ')
    .replace(/\n/g, '')
    .trim();
}

function pruneUnusedCustomProperties(css: string): string {
  // Best-effort pruning of custom properties that are defined but never referenced.
  // This is intentionally conservative: we only remove declarations of the form
  // `--name: ...;` when `--name` does not appear elsewhere (e.g. in `var(--name)`).
  //
  // Important: Run pruning iteratively.
  // A variable can appear "used" only because it is referenced by another variable
  // that is itself unused. Example:
  //   --a: 1; --b: var(--a);
  // If --b is unused, the first pruning pass should remove --b, and a subsequent
  // pass can then remove --a. A single pass cannot catch this cascade.
  const defRe = /--([a-zA-Z0-9_-]+)\s*:/g;
  const useRe = /--([a-zA-Z0-9_-]+)\b/g;

  let result = css;
  // Safeguard against infinite loops. Dependency chains in our token set are shallow.
  for (let pass = 0; pass < 10; pass++) {
    const definedCounts = new Map<string, number>();
    for (const match of result.matchAll(defRe)) {
      const name = match[1] as string;
      definedCounts.set(name, (definedCounts.get(name) ?? 0) + 1);
    }

    if (definedCounts.size === 0) {
      return result;
    }

    const usedCounts = new Map<string, number>();
    for (const match of result.matchAll(useRe)) {
      const name = match[1] as string;
      usedCounts.set(name, (usedCounts.get(name) ?? 0) + 1);
    }

    const dead = new Set<string>();
    for (const [name, defCount] of definedCounts.entries()) {
      const total = usedCounts.get(name) ?? 0;
      // If the only occurrences are the definitions themselves, the variable is never referenced.
      if (total === defCount) {
        dead.add(name);
      }
    }

    if (dead.size === 0) {
      return result;
    }

    // Remove `--name: ...;` for each dead property. Values are assumed to not contain ';'.
    // This is a safe assumption for our current token set (colors, sizes, var(), color-mix()).
    let next = result;
    // Longest-first helps avoid partial overlaps (e.g. `--x` vs `--x1`).
    const deadNames = Array.from(dead).sort((a, b) => b.length - a.length);
    for (const name of deadNames) {
      const escaped = name.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&');
      next = next.replace(new RegExp(`--${escaped}\\s*:[^;{}]*;`, 'g'), '');
    }

    if (next === result) {
      return result;
    }

    result = next;
  }

  return result;
}

function processCss(css: string, config: BuildModeConfig): string {
  let result = css;
  if (config.cssRemoveComments) result = removeCssComments(result);
  if (config.cssVariableShortening) result = shortenCssVariables(result);
  if (config.cssPruneUnusedCustomProperties) result = pruneUnusedCustomProperties(result);
  if (config.cssValueMinify) result = compressCssValues(result);
  return result;
}

export function cssInlinePlugin(mode: string): Plugin {
  const config = getBuildModeConfig(mode);

  return {
    name: 'css-inline',
    apply: 'build',
    enforce: 'post',

    generateBundle(_options, bundle) {
      const cssChunks: string[] = [];

      for (const [fileName, asset] of Object.entries(bundle)) {
        if (!fileName.endsWith('.css') || asset.type !== 'asset') continue;

        const { source } = asset as { source?: string | Uint8Array };
        let cssContent = '';
        if (typeof source === 'string') {
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

      const css = cssChunks.join(config.cssCompress ? '' : '\n');
      if (!css.trim()) return;

      const injectionCode = `(function(){if(typeof document==='undefined')return;var css=${JSON.stringify(
        css
      )};var s=document.getElementById('${STYLE_ID}');if(!s){s=document.createElement('style');s.id='${STYLE_ID}';(document.head||document.documentElement).appendChild(s);}s.textContent=css;})();\n`;

      for (const chunk of Object.values(bundle)) {
        if (chunk.type === 'chunk' && chunk.isEntry) {
          chunk.code = injectionCode + chunk.code;
          break;
        }
      }
    },
  };
}

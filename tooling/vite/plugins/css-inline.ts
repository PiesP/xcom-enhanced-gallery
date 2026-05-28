// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * @fileoverview CSS inlining plugin for Vite
 *
 * Processes and optimizes CSS during the build phase:
 * - Minifies CSS via lightningcss (comment removal, value compression, unused property pruning)
 * - Shortens CSS variable names (--xeg-* -> --x*)
 * - Injects final CSS into entry chunk as IIFE
 */

import { transform } from 'lightningcss';
import type { Plugin } from 'vite';

import { escapeRegExp, getBuildModeConfig, STYLE_ID } from '../constants';
import type { BuildModeConfig } from '../types';

/**
 * Map of long CSS variable names to shortened equivalents.
 *
 * Production builds use this map to reduce CSS file size by replacing
 * verbose variable names (--xeg-color-primary) with short codes (--xc-p).
 */
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

  // Unprefixed design tokens (internal-only)
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

/**
 * Replace long CSS variable names with shortened versions.
 *
 * Sorted by name length (longest first) to avoid partial overlaps.
 */
function shortenCssVariables(css: string): string {
  let result = css;
  const sortedEntries = Object.entries(CSS_VAR_SHORTENING_MAP).sort(
    (a, b) => b[0].length - a[0].length
  );
  for (const [longName, shortName] of sortedEntries) {
    result = result.replace(new RegExp(escapeRegExp(longName), 'g'), shortName);
  }
  return result;
}

/**
 * Safely serialize a string for embedding inside JavaScript code.
 */
function safeJsStringify(str: string): string {
  return JSON.stringify(str)
    .replace(/</g, '\\u003C')
    .replace(/>/g, '\\u003E')
    .replace(/\//g, '\\u002F');
}

/**
 * Apply configured CSS optimizations in sequence.
 *
 * 1. Minify via lightningcss (comment removal, value compression, unused property pruning)
 * 2. Shorten variable names (if cssVariableShortening enabled)
 */
function processCss(css: string, config: BuildModeConfig): string {
  let result = css;
  if (config.cssCompress) {
    const { code } = transform({
      code: Buffer.from(result),
      filename: 'bundle.css',
      minify: true,
    });
    result = code.toString();
  }
  if (config.cssVariableShortening) {
    result = shortenCssVariables(result);
  }
  return result;
}

/**
 * Vite build plugin for inlining and optimizing CSS.
 *
 * During the post-build phase:
 * 1. Extracts all .css assets from the bundle
 * 2. Processes CSS according to build mode config
 * 3. Injects processed CSS as IIFE into the entry chunk
 * 4. Removes original .css files from bundle
 *
 * @param mode Build mode identifier (e.g., 'production', 'development')
 * @returns Vite Plugin object
 */
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

      const safeStyleId = safeJsStringify(STYLE_ID);
      const injectionCode = `(function(){if(typeof document==='undefined')return;var css=${safeJsStringify(
        css
      )};var s=document.getElementById(${safeStyleId});if(!s){s=document.createElement('style');s.id=${safeStyleId};(document.head||document.documentElement).appendChild(s);}s.textContent=css;})();\n`;

      for (const chunk of Object.values(bundle)) {
        if (chunk.type === 'chunk' && chunk.isEntry) {
          chunk.code = injectionCode + chunk.code;
          break;
        }
      }
    },
  };
}

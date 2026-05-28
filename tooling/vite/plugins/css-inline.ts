// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * @fileoverview CSS inlining plugin for Vite
 *
 * Processes and optimizes CSS during the build phase:
 * - Minifies CSS via lightningcss (comment removal, value compression, unused property pruning)
 * - Injects final CSS into entry chunk as IIFE
 */

import { transform } from 'lightningcss';
import type { Plugin } from 'vite';

import { getBuildModeConfig, STYLE_ID } from '../constants';
import type { BuildModeConfig } from '../types';

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

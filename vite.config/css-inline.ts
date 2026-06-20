// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * Vite plugin: inject inlined CSS into the IIFE bundle.
 *
 * Runs as a post-build step, collects all CSS assets, removes them from
 * the bundle, and prepends a self-executing <style> injection script to
 * the entry chunk.
 */

import type { Plugin } from 'vite';

/** ID for injected style element in DOM. */
const STYLE_ID = 'xeg-injected-styles' as const;

export function cssInlinePlugin(): Plugin {
  return {
    name: 'css-inline',
    apply: 'build',
    enforce: 'post',

    generateBundle(_options, bundle) {
      const cssChunks: string[] = [];

      for (const [fileName, asset] of Object.entries(bundle)) {
        if (!fileName.endsWith('.css') || asset.type !== 'asset') continue;
        const source = (asset as { source?: string | Uint8Array }).source;
        if (typeof source === 'string') {
          cssChunks.push(source);
        } else if (source instanceof Uint8Array) {
          cssChunks.push(new TextDecoder().decode(source));
        }
        delete bundle[fileName];
      }

      const css = cssChunks.join('');
      if (!css.trim()) return;

      const id = JSON.stringify(STYLE_ID);
      const code = JSON.stringify(css);
      const injectionCode = `(function(){if(typeof document==='undefined')return;var e=document.getElementById(${id});if(!e){e=document.createElement('style');e.id=${id};document.head.appendChild(e);}e.textContent=${code};})();\n`;

      for (const chunk of Object.values(bundle)) {
        if (chunk.type === 'chunk' && chunk.isEntry) {
          chunk.code = injectionCode + chunk.code;
          break;
        }
      }
    },
  };
}

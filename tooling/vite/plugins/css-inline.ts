// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * CSS Inline Plugin — Vite plugin that inlines CSS into the JS bundle.
 *
 * Collects all CSS output from the bundle, removes individual CSS files,
 * and prepends a self-executing function that injects the CSS as a
 * `<style>` element into the document head.
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

      // Inject into ALL entry chunks (ES module lib mode may have multiple entries)
      let injected = false;
      for (const chunk of Object.values(bundle)) {
        if (chunk.type === 'chunk' && (chunk.isEntry || chunk.name === 'content' || chunk.name === 'background')) {
          chunk.code = injectionCode + chunk.code;
          injected = true;
        }
      }

      // Fallback: if no entry chunk found, inject into the first chunk
      if (!injected) {
        for (const chunk of Object.values(bundle)) {
          if (chunk.type === 'chunk') {
            chunk.code = injectionCode + chunk.code;
            break;
          }
        }
      }
    },
  };
}

// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * @fileoverview Minimum-viable CSS inlining plugin for Vite.
 *
 * Extracts .css assets from the bundle and inlines them as an IIFE into the
 * entry chunk. CSS minification is delegated to Rolldown's native cssMinify
 * option in the Vite config — no separate minifier dependency needed.
 */

import type { Plugin } from 'vite';
import { STYLE_ID } from '../constants';

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

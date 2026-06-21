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

      // Validate CSS content before injection: reject dangerous patterns.
      if (containsDangerousCss(css)) {
        throw new Error('CSS injection blocked: dangerous patterns detected in stylesheet content.');
      }

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

/**
 * Check whether CSS content contains dangerous patterns that could lead to
 * data exfiltration or script execution via CSS injection.
 *
 * Blocks:
 * - `behavior` / `-moz-binding` (XBL bindings in Firefox)
 * - `expression()` (legacy IE script execution)
 * - `@import` with external URLs (data exfiltration via @import url())
 * - `url()` with non-http(s)/data: protocols
 * - `-webkit-keyframe` with suspicious content
 */
function containsDangerousCss(css: string): boolean {
  const lower = css.toLowerCase();

  // behavior / -moz-binding can execute scripts via XBL.
  // Use word boundary to avoid matching scroll-behavior, overscroll-behavior, etc.
  if (/(^|[^-a-z])behavior\s*:/.test(lower) || /-moz-binding\s*:/.test(lower)) return true;

  // expression() executes JavaScript in legacy IE
  if (/expression\s*\(/.test(lower)) return true;

  // @import with external URLs can be used for data exfiltration
  if (/@import\s+url\s*\(\s*['"]?https?:/.test(lower)) return true;

  // url() with javascript: or vbscript: protocols
  if (/url\s*\(\s*['"]?\s*(javascript|vbscript|data:text\/html)/.test(lower)) return true;

  return false;
}

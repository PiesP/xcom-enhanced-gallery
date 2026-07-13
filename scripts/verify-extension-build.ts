#!/usr/bin/env node
// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * Post-build verification for extension output.
 *
 * Chrome MV3 content scripts MUST be classic scripts (IIFE format).
 * If content.js contains ES module import/export, Chrome throws SyntaxError
 * and the entire extension silently fails to load.
 *
 * This script MUST be called as the final step of `pnpm build:extension`.
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const distDir = process.argv[2] || 'dist-extension';
const contentJs = resolve(root, distDir, 'content.js');

let failed = false;

function fail(msg: string) {
  console.error(`❌ ${msg}`);
  failed = true;
}

function pass(msg: string) {
  console.log(`✅ ${msg}`);
}

// 1. Ensure content.js exists
if (!existsSync(contentJs)) {
  fail('dist-extension/content.js was not produced — build failed or config is broken');
  process.exit(1);
}

const content = readFileSync(contentJs, 'utf-8');

// 2. Check for bare import statements (ES module leakage)
//    IIFE output should only have `(function(){...})()` or similar wrapper
const lines = content.split('\n');
for (let i = 0; i < Math.min(lines.length, 50); i++) {
  const line = lines[i].trim();
  // Allow comments and the IIFE wrapper, but not bare import/export
  if (/^import\s/.test(line) && !line.startsWith('//')) {
    fail(
      `content.js line ${i + 1} contains import statement:\n    ${line}\n` +
      `Content script MUST be IIFE format. Check vite.extension.cs.config.ts formats.`
    );
    break;
  }
  if (/^export\s/.test(line) && !line.startsWith('//')) {
    fail(
      `content.js line ${i + 1} contains export statement:\n    ${line}\n` +
      `Content script MUST be IIFE format. Check vite.extension.cs.config.ts formats.`
    );
    break;
  }
}

// 3. Check that content.js starts with an IIFE wrapper
const firstLine = lines[0] || '';
if (!firstLine.startsWith('(function(') && !firstLine.startsWith('!function(') && firstLine !== '"use strict";') {
  fail(
    `content.js does not start with an IIFE wrapper.\n` +
    `First line: "${firstLine.slice(0, 80)}"\n` +
    `Content script MUST be IIFE format for Chrome compatibility.`
  );
}

// 4. Verify background.js is ES module (can have import)
const backgroundJs = resolve(root, 'dist-extension', 'background.js');
if (!existsSync(backgroundJs)) {
  fail('dist-extension/background.js was not produced — build failed');
} else {
  const bg = readFileSync(backgroundJs, 'utf-8');
  const bgLines = bg.split('\n').slice(0, 10);
  const hasImport = bgLines.some(l => /^\s*import\s/.test(l) || /\bimport\s*\{/.test(l));
  if (hasImport) {
    pass('background.js is ES module (correct for Service Worker)');
  } else {
    pass('background.js produced');
  }
  void bg; // suppress unused warning
}

// 5. Verify manifest.json exists
const manifest = resolve(root, 'dist-extension', 'manifest.json');
if (!existsSync(manifest)) {
  fail('dist-extension/manifest.json was not produced');
} else {
  pass('manifest.json copied to output');
}

if (failed) {
  console.error('\n❌ Extension build verification FAILED');
  console.error('Do NOT load this build in Chrome — content script will throw SyntaxError.\n');
  process.exit(1);
}

console.log('\n✅ Extension build verification passed\n');

#!/usr/bin/env node
// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/** Verify that an extension build contains classic IIFE content code and required assets. */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..', '..');
const distDir = process.argv[2] ?? 'dist-extension';
const contentJs = resolve(root, distDir, 'content.js');
let failed = false;

function fail(message: string): void {
  console.error(`❌ ${message}`);
  failed = true;
}

function pass(message: string): void {
  console.log(`✅ ${message}`);
}

if (!existsSync(contentJs)) {
  fail(`${distDir}/content.js was not produced — build failed or config is broken`);
  process.exit(1);
}

const lines = readFileSync(contentJs, 'utf8').split('\n');
for (let index = 0; index < Math.min(lines.length, 50); index++) {
  const line = lines[index]?.trim() ?? '';
  if (/^(?:import|export)\s/.test(line) && !line.startsWith('//')) {
    fail(
      `content.js line ${index + 1} contains an ES module statement:\n    ${line}\n` +
        'Content scripts must use IIFE format. Check the content-script Vite config.'
    );
    break;
  }
}

const firstLine = lines[0] ?? '';
if (
  !firstLine.startsWith('(function(') &&
  !firstLine.startsWith('!function(') &&
  firstLine !== '"use strict";'
) {
  fail(`content.js does not start with an IIFE wrapper.\nFirst line: "${firstLine.slice(0, 80)}"`);
}

for (const file of ['background.js', 'manifest.json']) {
  if (!existsSync(resolve(root, distDir, file))) {
    fail(`${distDir}/${file} was not produced`);
  } else {
    pass(`${file} produced`);
  }
}

if (failed) {
  throw new Error('Extension build verification failed.');
}
console.log('\n✅ Extension build verification passed\n');

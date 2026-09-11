#!/usr/bin/env node
// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/** Verify that an extension build contains classic IIFE content code and required assets. */
import { existsSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  type ExtensionIconDeclaration,
  readExtensionIconDeclarations,
} from '../../tooling/vite/utils/extension-icons.ts';

const root = resolve(import.meta.dirname, '..', '..');
const distDir = process.argv[2] ?? 'dist-extension';
const contentJs = resolve(root, distDir, 'content.js');
const manifestJson = resolve(root, distDir, 'manifest.json');
const notificationFallbackIcon = 'icons/icon-128x128.png';
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

let icons: readonly ExtensionIconDeclaration[] = [];
if (existsSync(manifestJson)) {
  try {
    icons = readExtensionIconDeclarations(manifestJson);
  } catch (error: unknown) {
    fail(error instanceof Error ? error.message : String(error));
  }
}

for (const icon of icons) {
  const outputIcon = resolve(root, distDir, icon.path);
  if (!existsSync(outputIcon)) {
    fail(`${distDir}/${icon.path} declared by manifest.json was not produced`);
  } else if (!statSync(outputIcon).isFile()) {
    fail(`${distDir}/${icon.path} declared by manifest.json is not a file`);
  } else {
    pass(`${icon.path} produced`);
  }
}

const manifestFallback = icons.find((icon) => icon.size === '128')?.path;
if (icons.length > 0 && manifestFallback !== notificationFallbackIcon) {
  fail(
    `manifest.json icon 128 must be ${notificationFallbackIcon} for the background notification fallback`
  );
}

if (failed) {
  throw new Error('Extension build verification failed.');
}
console.log('\n✅ Extension build verification passed\n');

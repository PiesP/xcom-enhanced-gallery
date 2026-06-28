// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * Extension packaging script — creates ZIP files for Chrome and Firefox.
 *
 * Usage:
 *   node scripts/package-extension.js
 *
 * Output:
 *   dist/extension-chrome-v{version}.zip
 *   dist/extension-firefox-v{version}.zip
 */

import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf-8'));
const version = pkg.version;

const targets = [
  { dir: 'dist-extension', name: 'chrome' },
  { dir: 'dist-extension-firefox', name: 'firefox' },
];

const distDir = resolve(root, 'dist');
if (!existsSync(distDir)) {
  mkdirSync(distDir, { recursive: true });
}

for (const { dir, name } of targets) {
  const sourceDir = resolve(root, dir);
  if (!existsSync(sourceDir)) {
    console.warn(`[package:extension] Skipping ${name}: ${dir} does not exist. Run build first.`);
    continue;
  }

  const outputFile = resolve(distDir, `extension-${name}-v${version}.zip`);
  execSync(`cd "${sourceDir}" && zip -r -q "${outputFile}" .`);
  console.log(`[package:extension] Created ${outputFile}`);
}

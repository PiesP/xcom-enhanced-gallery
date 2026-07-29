// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..', '..');
const packageJson = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8')) as {
  version?: string;
};
if (!packageJson.version) {
  throw new Error('package.json does not define a version.');
}

const targets = [
  { dir: 'dist-extension', name: 'chrome' },
  { dir: 'dist-extension-firefox', name: 'firefox' },
] as const;
const distDir = resolve(root, 'dist');
mkdirSync(distDir, { recursive: true });

for (const { dir, name } of targets) {
  const sourceDir = resolve(root, dir);
  if (!existsSync(sourceDir)) {
    console.warn(`[package:extension] Skipping ${name}: ${dir} does not exist. Run build first.`);
    continue;
  }

  const outputFile = resolve(distDir, `extension-${name}-v${packageJson.version}.zip`);
  rmSync(outputFile, { force: true });
  execFileSync('zip', ['-r', '-q', outputFile, '.'], { cwd: sourceDir, stdio: 'inherit' });
  console.log(`[package:extension] Created ${outputFile}`);
}

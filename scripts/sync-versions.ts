// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const pkg = JSON.parse(readFileSync(resolve(process.cwd(), 'package.json'), 'utf-8'));
const expected = pkg.version;
let synced = 0;

for (const file of ['extension/manifest.json', 'extension/manifest.firefox.json']) {
  const full = resolve(process.cwd(), file);
  if (!readFileSync(full, 'utf-8')) continue;

  const content = readFileSync(full, 'utf-8');
  const manifest = JSON.parse(content);
  if (manifest.version !== expected) {
    manifest.version = expected;
    writeFileSync(full, JSON.stringify(manifest, null, 2) + '\n');
    console.log(`✓ Synced ${file} → v${expected}`);
    synced++;
  } else {
    console.log(`✓ ${file} already at v${expected}`);
  }
}
console.log(`\nDone. ${synced} file(s) synced.`);

#!/usr/bin/env node
/* eslint-env node */
/* global process, console */
/*
 * Serial runner for refactoring tests to avoid Windows teardown error in multi-file runs.
 * Runs: vitest run <each file> --reporter=default
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = process.cwd();
const TARGET_DIR = path.resolve(ROOT, 'test', 'refactoring');

function collectTestFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      files.push(...collectTestFiles(full));
    } else if (/\.(test|spec)\.(ts|tsx|js|jsx)$/.test(ent.name)) {
      files.push(full);
    }
  }
  return files;
}

if (!fs.existsSync(TARGET_DIR)) {
  console.error('Missing directory:', TARGET_DIR);
  process.exit(1);
}

const files = collectTestFiles(TARGET_DIR).sort((a, b) => a.localeCompare(b));
if (files.length === 0) {
  console.warn('No test files found under', TARGET_DIR);
  process.exit(0);
}

let failed = 0;
for (const file of files) {
  console.log(`\n▶ Running: ${path.relative(ROOT, file)}`);
  const vitestBin = path.resolve(
    ROOT,
    'node_modules',
    '.bin',
    process.platform === 'win32' ? 'vitest.cmd' : 'vitest'
  );
  const args = ['run', file, '--reporter=default'];
  const res = spawnSync(vitestBin, args, {
    cwd: ROOT,
    stdio: 'inherit',
    env: { ...process.env, VITEST_MODE: 'refactoring' },
  });
  if (res.status !== 0) {
    failed += 1;
  }
}

if (failed > 0) {
  console.error(`\n❌ ${failed} file(s) failed.`);
  process.exit(1);
}

console.log('\n✅ All refactoring test files passed (serial run).');
process.exit(0);

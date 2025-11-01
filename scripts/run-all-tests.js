#!/usr/bin/env node
/**
 * Run all test projects sequentially with aggregated exit code
 * - Replaces bash-based scripts/run-all-tests.sh (Node-only policy)
 * - Provides --dry or --list to preview without executing
 * - Prints clear pass/fail for each suite and final summary
 */

import { spawnSync } from 'node:child_process';

const args = process.argv.slice(2);
const isDryRun = args.includes('--dry') || args.includes('--dry-run') || args.includes('--list');

const tests = [
  { name: 'smoke tests', cmd: ['npm', ['run', 'test:smoke']] },
  { name: 'unit tests', cmd: ['npm', ['run', 'test:unit']] },
  { name: 'style tests', cmd: ['npm', ['run', 'test:styles']] },
  { name: 'performance tests', cmd: ['npm', ['run', 'test:perf']] },
  { name: 'phase tests', cmd: ['npm', ['run', 'test:phases']] },
  { name: 'refactor tests', cmd: ['npm', ['run', 'test:refactor']] },
  { name: 'browser tests', cmd: ['npm', ['run', 'test:browser']] },
];

function runOne(name, command, args) {
  console.log('');
  console.log(`📍 Running ${name}...`);

  if (isDryRun) {
    console.log(`ℹ️  Dry-run: ${[command, ...args].join(' ')}`);
    return true;
  }

  const res = spawnSync(command, args, { stdio: 'inherit', shell: true });
  const ok = res.status === 0;
  if (ok) {
    console.log(`✅ ${name} passed`);
  } else {
    console.log(`❌ ${name} failed`);
  }
  return ok;
}

function main() {
  console.log('🧪 Running all tests...');

  let exitCode = 0;
  for (const t of tests) {
    const [cmd, a] = t.cmd;
    const ok = runOne(t.name, cmd, a);
    if (!ok) exitCode = 1; // continue running others
  }

  console.log('');
  console.log('=========================================');
  if (exitCode === 0) {
    console.log('✅ All tests passed!');
  } else {
    console.log(`❌ Some tests failed (EXIT_CODE=${exitCode})`);
  }
  console.log('=========================================');

  process.exit(exitCode);
}

main();

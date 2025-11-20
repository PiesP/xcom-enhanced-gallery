#!/usr/bin/env node
/**
 * Run all test projects sequentially with aggregated exit code.
 */

import { spawnSync } from 'node:child_process';

const args = process.argv.slice(2);
const isDryRun = args.includes('--dry') || args.includes('--dry-run') || args.includes('--list');

interface TestCommand {
  name: string;
  cmd: [string, string[]];
}

const tests: TestCommand[] = [
  { name: 'smoke tests', cmd: ['npm', ['run', 'test:smoke']] },
  { name: 'unit tests', cmd: ['npm', ['run', 'test:unit']] },
  { name: 'style tests', cmd: ['npm', ['run', 'test:styles']] },
  { name: 'performance tests', cmd: ['npm', ['run', 'test:perf']] },
  { name: 'phase tests', cmd: ['npm', ['run', 'test:phases']] },
  { name: 'refactor tests', cmd: ['npm', ['run', 'test:refactor']] },
  { name: 'browser tests', cmd: ['npm', ['run', 'test:browser']] },
];

function runOne(name: string, command: string, commandArgs: string[]): boolean {
  console.log('');
  console.log(`📍 Running ${name}...`);

  if (isDryRun) {
    console.log(`ℹ️  Dry-run: ${[command, ...commandArgs].join(' ')}`);
    return true;
  }

  const res = spawnSync(command, commandArgs, { stdio: 'inherit', shell: true });
  const ok = res.status === 0;
  if (ok) {
    console.log(`✅ ${name} passed`);
  } else {
    console.log(`❌ ${name} failed`);
  }
  return ok;
}

function main(): void {
  console.log('🧪 Running all tests...');

  let exitCode = 0;
  const failedSuites: string[] = [];
  for (const test of tests) {
    const [cmd, commandArgs] = test.cmd;
    const ok = runOne(test.name, cmd, commandArgs);
    if (!ok) {
      exitCode = 1;
      failedSuites.push(test.name);
    }
  }

  console.log('');
  console.log('=========================================');
  if (exitCode === 0) {
    console.log('✅ All tests passed!');
  } else {
    console.log(`❌ Some tests failed (EXIT_CODE=${exitCode})`);
    if (failedSuites.length > 0) {
      console.log('   ↳ Failed suites (latest failures last):');
      failedSuites.forEach(suite => console.log(`      • ${suite}`));
    }
  }
  console.log('=========================================');

  process.exit(exitCode);
}

main();

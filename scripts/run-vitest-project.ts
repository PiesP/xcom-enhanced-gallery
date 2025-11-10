#!/usr/bin/env node
/**
 * Vitest Project Runner with DRY Principles.
 */

import { spawnSync } from 'node:child_process';
import { startVitest } from 'vitest/node';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = resolve(__dirname, '..');

const args = process.argv.slice(2);
const project = args[0];

const ALLOWED_PROJECTS = new Set([
  'smoke',
  'fast',
  'unit',
  'styles',
  'performance',
  'phases',
  'refactor',
  'browser',
]);

let memory = 2048;
let vitestArgsStart = 1;

if (args[1] && /^\d+$/.test(args[1])) {
  memory = Number.parseInt(args[1], 10);
  vitestArgsStart = 2;
}

const noCleanup = args.includes('--no-cleanup');
const rawVitestArgs = args.slice(vitestArgsStart).filter(arg => arg !== '--no-cleanup');
const wantsCoverage =
  process.env.XEG_VITEST_COVERAGE === '1' || rawVitestArgs.some(arg => arg === '--coverage');
const forwardedVitestArgs = rawVitestArgs.filter(arg => arg !== '--coverage');

function mergeNodeOptions(current: string | undefined, required: string[]): string {
  const existing = current?.split(/\s+/).filter(Boolean) ?? [];
  const normalizedRequired = required.filter(Boolean);
  const extras = existing.filter(token => !normalizedRequired.includes(token));
  return [...normalizedRequired, ...extras].join(' ').trim();
}

if (!project || !ALLOWED_PROJECTS.has(project)) {
  console.error('❌ Error: Project name is required');
  console.error(
    'Usage: node scripts/run-vitest-project.ts <project> [memory] [vitest-args...] [--no-cleanup]'
  );
  console.error('Example: node scripts/run-vitest-project.ts smoke 2048');
  console.error('Example: node scripts/run-vitest-project.ts unit 3072 --coverage');
  if (project && !ALLOWED_PROJECTS.has(project)) {
    console.error(`Allowed projects: ${Array.from(ALLOWED_PROJECTS).join(', ')}`);
  }
  process.exit(1);
}

if (!Number.isFinite(memory) || memory < 256 || memory > 16384) {
  memory = 2048;
}

process.env.NODE_OPTIONS = mergeNodeOptions(process.env.NODE_OPTIONS, [
  `--max-old-space-size=${memory}`,
  '--preserve-symlinks',
]);
process.env.VITEST_MAX_THREADS = process.env.VITEST_MAX_THREADS ?? '1';

console.log(`\n🧪 Running Vitest project: ${project}`);
console.log(`💾 Memory allocation: ${memory} MB`);
console.log(`⚙️  Coverage: ${wantsCoverage ? 'enabled' : 'disabled'}`);
console.log(`🧹 Worker cleanup: ${noCleanup ? 'disabled' : 'enabled'}\n`);

let exitCode = 0;

const vitestArgv: string[] = [
  '--project',
  project,
  'run',
  ...(wantsCoverage ? ['--coverage'] : []),
  ...forwardedVitestArgs,
];

try {
  const ctx = await startVitest('test', vitestArgv);
  type ExitCodeReader = { getExitCode?: () => number | Promise<number> };
  const state = ctx?.state as ExitCodeReader | undefined;
  const code = typeof state?.getExitCode === 'function' ? await state.getExitCode() : 0;
  exitCode = Number.isInteger(code) ? (code as number) : 0;
  if (exitCode === 0) {
    console.log(`\n✅ Vitest project '${project}' completed successfully`);
  } else {
    console.error(`\n❌ Vitest project '${project}' failed with exit code ${exitCode}`);
  }
} catch (error) {
  exitCode = 1;
  const message = error instanceof Error ? error.message : String(error);
  console.error(`\n❌ Vitest project '${project}' failed: ${message}`);
}

if (!noCleanup) {
  console.log('\n🧹 Cleaning up Vitest workers...');
  const cleanupRun = spawnSync('tsx', ['./scripts/cleanup-vitest-workers.ts'], {
    stdio: 'inherit',
    cwd: PROJECT_ROOT,
    env: process.env,
  });
  if (cleanupRun.error || (typeof cleanupRun.status === 'number' && cleanupRun.status !== 0)) {
    console.warn('⚠️  Warning: Worker cleanup failed, continuing...');
  } else {
    console.log('✅ Worker cleanup completed');
  }
}

console.log(`\n🏁 Exit code: ${exitCode}\n`);
process.exit(exitCode);

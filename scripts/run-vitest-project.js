#!/usr/bin/env node

/**
 * Vitest Project Runner with DRY Principles
 *
 * @description Centralized runner for Vitest projects with unified memory management and worker cleanup
 * @usage node scripts/run-vitest-project.js <project> [memory] [vitest-args...] [--no-cleanup]
 *
 * @example
 * node scripts/run-vitest-project.js smoke 2048
 * node scripts/run-vitest-project.js unit 3072
 * node scripts/run-vitest-project.js unit 3072 --coverage
 * node scripts/run-vitest-project.js raf-timing 2048 --no-cleanup
 *
 * @param {string} project - Vitest project name (e.g., smoke, unit, styles)
 * @param {number} [memory=2048] - Memory allocation in MB (default: 2048)
 * @param {string[]} [vitest-args] - Additional Vitest arguments (e.g., --coverage, --watch)
 * @param {string} [--no-cleanup] - Skip worker cleanup (for specific use cases)
 *
 * @features
 * - Centralized NODE_OPTIONS configuration
 * - Automatic VITEST_MAX_THREADS=1 (single-threaded stability)
 * - Worker cleanup after test completion (success or failure)
 * - Proper exit code propagation
 * - Pass-through of additional Vitest arguments
 */

import { spawnSync } from 'node:child_process';
import { startVitest } from 'vitest/node';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Parse arguments
const args = process.argv.slice(2);
const project = args[0];

// Restrict project to known Vitest project names
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

// Find memory argument (first numeric argument or default)
let memory = 2048;
let vitestArgsStart = 1;

if (args[1] && /^\d+$/.test(args[1])) {
  memory = parseInt(args[1], 10);
  vitestArgsStart = 2;
}

// Extract flags and --no-cleanup; do NOT forward arbitrary args to Vitest
const noCleanup = args.includes('--no-cleanup');
const rawVitestArgs = args.slice(vitestArgsStart).filter(arg => arg !== '--no-cleanup');
const wantsCoverage =
  process.env.XEG_VITEST_COVERAGE === '1' || rawVitestArgs.includes('--coverage');

// Validate project argument
if (!project || !ALLOWED_PROJECTS.has(project)) {
  console.error('❌ Error: Project name is required');
  console.error(
    'Usage: node scripts/run-vitest-project.js <project> [memory] [vitest-args...] [--no-cleanup]'
  );
  console.error('Example: node scripts/run-vitest-project.js smoke 2048');
  console.error('Example: node scripts/run-vitest-project.js unit 3072 --coverage');
  if (project && !ALLOWED_PROJECTS.has(project)) {
    console.error(`Allowed projects: ${Array.from(ALLOWED_PROJECTS).join(', ')}`);
  }
  process.exit(1);
}

// Set Node.js options
// Bound memory to a sane range
if (!Number.isFinite(memory) || memory < 256 || memory > 16384) {
  memory = 2048;
}
process.env.NODE_OPTIONS = `--max-old-space-size=${memory} --preserve-symlinks`;
process.env.VITEST_MAX_THREADS = '1';

console.log(`\n🧪 Running Vitest project: ${project}`);
console.log(`💾 Memory allocation: ${memory} MB`);
console.log(`⚙️  Coverage: ${wantsCoverage ? 'enabled' : 'disabled'}`);
console.log(`🧹 Worker cleanup: ${noCleanup ? 'disabled' : 'enabled'}\n`);

let exitCode = 0;

// Build Vitest CLI-like args for Node API (constant tokens only)
const vitestArgv = ['--project', project, 'run', ...(wantsCoverage ? ['--coverage'] : [])];

try {
  const ctx = await startVitest('test', vitestArgv);
  // Attempt to read exit code from vitest context if available
  const code = typeof ctx?.state?.getExitCode === 'function' ? await ctx.state.getExitCode() : 0;
  exitCode = Number.isInteger(code) ? code : 0;
  if (exitCode === 0) {
    console.log(`\n✅ Vitest project '${project}' completed successfully`);
  } else {
    console.error(`\n❌ Vitest project '${project}' failed with exit code ${exitCode}`);
  }
} catch (err) {
  exitCode = 1;
  console.error(
    `\n❌ Vitest project '${project}' failed: ${err instanceof Error ? err.message : String(err)}`
  );
}

// Worker cleanup (unless explicitly disabled)
if (!noCleanup) {
  console.log('\n🧹 Cleaning up Vitest workers...');
  const cleanupRun = spawnSync(process.execPath, ['./scripts/cleanup-vitest-workers.js'], {
    stdio: 'inherit',
    cwd: resolve(__dirname, '..'),
    env: process.env,
  });
  if (cleanupRun.error || (typeof cleanupRun.status === 'number' && cleanupRun.status !== 0)) {
    console.warn('⚠️  Warning: Worker cleanup failed, continuing...');
    // Do not change exit code if cleanup fails
  } else {
    console.log('✅ Worker cleanup completed');
  }
}

console.log(`\n🏁 Exit code: ${exitCode}\n`);
process.exit(exitCode);

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

import { execSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Parse arguments
const args = process.argv.slice(2);
const project = args[0];

// Find memory argument (first numeric argument or default)
let memory = 2048;
let vitestArgsStart = 1;

if (args[1] && /^\d+$/.test(args[1])) {
  memory = parseInt(args[1], 10);
  vitestArgsStart = 2;
}

// Extract Vitest arguments and --no-cleanup flag
const noCleanup = args.includes('--no-cleanup');
const vitestArgs = args
  .slice(vitestArgsStart)
  .filter(arg => arg !== '--no-cleanup')
  .join(' ');

// Validate project argument
if (!project) {
  console.error('❌ Error: Project name is required');
  console.error(
    'Usage: node scripts/run-vitest-project.js <project> [memory] [vitest-args...] [--no-cleanup]'
  );
  console.error('Example: node scripts/run-vitest-project.js smoke 2048');
  console.error('Example: node scripts/run-vitest-project.js unit 3072 --coverage');
  process.exit(1);
}

// Set Node.js options
process.env.NODE_OPTIONS = `--max-old-space-size=${memory} --preserve-symlinks`;
process.env.VITEST_MAX_THREADS = '1';

console.log(`\n🧪 Running Vitest project: ${project}`);
console.log(`💾 Memory allocation: ${memory} MB`);
if (vitestArgs) {
  console.log(`⚙️  Additional args: ${vitestArgs}`);
}
console.log(`🧹 Worker cleanup: ${noCleanup ? 'disabled' : 'enabled'}\n`);

let exitCode = 0;

try {
  // Build vitest command with additional arguments
  const vitestCmd = vitestArgs
    ? `npx vitest --project ${project} ${vitestArgs}`
    : `npx vitest --project ${project} run`;

  execSync(vitestCmd, {
    stdio: 'inherit',
    cwd: resolve(__dirname, '..'),
  });
  console.log(`\n✅ Vitest project '${project}' completed successfully`);
} catch (error) {
  exitCode = error.status || 1;
  console.error(`\n❌ Vitest project '${project}' failed with exit code ${exitCode}`);
}

// Worker cleanup (unless explicitly disabled)
if (!noCleanup) {
  console.log('\n🧹 Cleaning up Vitest workers...');
  try {
    execSync('node ./scripts/cleanup-vitest-workers.js', {
      stdio: 'inherit',
      cwd: resolve(__dirname, '..'),
    });
    console.log('✅ Worker cleanup completed');
  } catch {
    console.warn('⚠️  Warning: Worker cleanup failed, continuing...');
    // Do not change exit code if cleanup fails
  }
}

console.log(`\n🏁 Exit code: ${exitCode}\n`);
process.exit(exitCode);

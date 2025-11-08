#!/usr/bin/env node

/**
 * Batched Unit Test Runner with Automatic Cleanup
 *
 * @description Runs unit tests in small batches to avoid EPIPE errors
 * @usage node scripts/run-unit-tests-batched.js [options]
 *
 * @options
 * --batch-size=N    Number of test files per batch (default: 20)
 * --memory=N        Memory allocation in MB (default: 3072)
 * --fail-fast       Stop on first batch failure (default: false)
 * --pattern=GLOB    Test file pattern (default: test/unit/**\/*.{test,spec}.{ts,tsx})
 * --verbose         Show detailed output
 *
 * @example
 * node scripts/run-unit-tests-batched.js
 * node scripts/run-unit-tests-batched.js --batch-size=10
 * node scripts/run-unit-tests-batched.js --fail-fast --verbose
 *
 * @features
 * - Automatic test file discovery
 * - Configurable batch size
 * - Worker cleanup between batches
 * - Progress reporting
 * - Failure summary
 * - EPIPE error mitigation
 */

import { spawnSync } from 'node:child_process';
import { glob } from 'glob';
import { resolve, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = resolve(__dirname, '..');

// Parse command-line arguments
const args = process.argv.slice(2);
const getArg = (name, defaultValue) => {
  const arg = args.find(a => a.startsWith(`--${name}=`));
  return arg ? arg.split('=')[1] : defaultValue;
};
const hasFlag = name => args.includes(`--${name}`);

const BATCH_SIZE = parseInt(getArg('batch-size', '20'), 10);
const MEMORY = parseInt(getArg('memory', '3072'), 10);
const FAIL_FAST = hasFlag('fail-fast');
const VERBOSE = hasFlag('verbose');
const PATTERN = getArg('pattern', 'test/unit/**/*.{test,spec}.{ts,tsx}');

console.log('\n🧪 Batched Unit Test Runner');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`📦 Batch size: ${BATCH_SIZE} files`);
console.log(`💾 Memory per batch: ${MEMORY} MB`);
console.log(`🎯 Pattern: ${PATTERN}`);
console.log(`⚡ Fail-fast: ${FAIL_FAST ? 'enabled' : 'disabled'}`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('\n💡 Tip: Use --verbose to see detailed output');
console.log('💡 Tip: Use --batch-size=10 for safer execution');
console.log('💡 Tip: Use --monitor-memory to track memory usage');
console.log('💡 Tip: See run-unit-tests-batched-enhanced.js for advanced options');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Discover test files
async function discoverTestFiles() {
  console.log('🔍 Discovering test files...');

  const files = await glob(PATTERN, {
    cwd: PROJECT_ROOT,
    absolute: false,
    ignore: ['**/node_modules/**', '**/dist/**', '**/*.d.ts'],
  });

  console.log(`✅ Found ${files.length} test files\n`);

  if (VERBOSE) {
    files.forEach(file => console.log(`   - ${file}`));
    console.log('');
  }

  return files;
}

// Split files into batches
function createBatches(files, batchSize) {
  const batches = [];
  for (let i = 0; i < files.length; i += batchSize) {
    batches.push(files.slice(i, i + batchSize));
  }
  return batches;
}

// Run cleanup script
function runCleanup() {
  if (VERBOSE) {
    console.log('🧹 Running worker cleanup...');
  }

  const result = spawnSync('node', ['./scripts/cleanup-vitest-workers.js'], {
    cwd: PROJECT_ROOT,
    stdio: VERBOSE ? 'inherit' : 'pipe',
    encoding: 'utf8',
  });

  return result.status === 0;
}

// Run a single batch
function runBatch(batch, batchIndex, totalBatches) {
  const batchNum = batchIndex + 1;
  console.log(`\n📊 Batch ${batchNum}/${totalBatches} (${batch.length} files)`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  if (VERBOSE) {
    batch.forEach(file => console.log(`   - ${relative(PROJECT_ROOT, file)}`));
    console.log('');
  }

  // Build Vitest command with specific file patterns
  const testPatterns = batch.map(file => relative(PROJECT_ROOT, file)).join(' ');

  const result = spawnSync(
    'npx',
    ['vitest', 'run', '--project', 'unit', '--reporter=verbose', ...testPatterns.split(' ')],
    {
      cwd: PROJECT_ROOT,
      stdio: 'inherit',
      encoding: 'utf8',
      env: {
        ...process.env,
        NODE_OPTIONS: `--max-old-space-size=${MEMORY} --preserve-symlinks`,
        VITEST_MAX_THREADS: '1',
      },
    }
  );

  const success = result.status === 0;

  if (success) {
    console.log(`✅ Batch ${batchNum} passed`);
  } else {
    console.log(`❌ Batch ${batchNum} failed (exit code: ${result.status})`);
  }

  return { success, exitCode: result.status };
}

// Main execution
async function main() {
  const startTime = Date.now();
  const results = [];

  try {
    // Discover test files
    const files = await discoverTestFiles();

    if (files.length === 0) {
      console.log('⚠️  No test files found matching pattern');
      process.exit(0);
    }

    // Create batches
    const batches = createBatches(files, BATCH_SIZE);
    console.log(`📦 Created ${batches.length} batches\n`);

    // Run each batch
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];

      // Run cleanup before each batch (except first)
      if (i > 0) {
        console.log('');
        runCleanup();
      }

      // Run batch
      const result = runBatch(batch, i, batches.length);
      results.push({
        batchNum: i + 1,
        fileCount: batch.length,
        ...result,
      });

      // Fail-fast mode
      if (!result.success && FAIL_FAST) {
        console.log('\n⚠️  Fail-fast enabled, stopping execution');
        break;
      }
    }

    // Final cleanup
    console.log('\n🧹 Final cleanup...');
    runCleanup();

    // Print summary
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 Test Summary');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const totalBatches = results.length;
    const passedBatches = results.filter(r => r.success).length;
    const failedBatches = results.filter(r => !r.success).length;
    const totalFiles = results.reduce((sum, r) => sum + r.fileCount, 0);

    console.log(`⏱️  Duration: ${duration}s`);
    console.log(`📦 Total batches: ${totalBatches}`);
    console.log(`📁 Total files: ${totalFiles}`);
    console.log(`✅ Passed batches: ${passedBatches}`);
    console.log(`❌ Failed batches: ${failedBatches}`);

    if (failedBatches > 0) {
      console.log('\n❌ Failed batches:');
      results
        .filter(r => !r.success)
        .forEach(r => {
          console.log(`   - Batch ${r.batchNum} (exit code: ${r.exitCode})`);
        });
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Exit with appropriate code
    const exitCode = failedBatches > 0 ? 1 : 0;
    process.exit(exitCode);
  } catch (error) {
    console.error('\n❌ Error during test execution:');
    console.error(error);
    process.exit(1);
  }
}

main();

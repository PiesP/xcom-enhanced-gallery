#!/usr/bin/env node

/**
 * Batched Unit Test Runner with Automatic Cleanup
 *
 * @description Runs unit tests in small batches to avoid EPIPE errors
 * @usage node scripts/run-unit-tests-batched.ts [options]
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
const getArg = (name: string, defaultValue: string): string => {
  const withEquals = args.find(entry => entry.startsWith(`--${name}=`));
  if (withEquals) {
    return withEquals.split('=')[1];
  }

  const index = args.indexOf(`--${name}`);
  if (index !== -1 && index + 1 < args.length) {
    const candidate = args[index + 1];
    if (!candidate.startsWith('--')) {
      return candidate;
    }
  }

  return defaultValue;
};
const hasFlag = (name: string): boolean => args.includes(`--${name}`);

const BATCH_SIZE = Number.parseInt(getArg('batch-size', '20'), 10);
const MEMORY = Number.parseInt(getArg('memory', '3072'), 10);
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
console.log('💡 Tip: See run-unit-tests-batched-enhanced.ts for advanced options');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Discover test files
async function discoverTestFiles(): Promise<string[]> {
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
function createBatches(files: string[], batchSize: number): string[][] {
  const batches: string[][] = [];
  for (let index = 0; index < files.length; index += batchSize) {
    batches.push(files.slice(index, index + batchSize));
  }
  return batches;
}

// Run cleanup script
function runCleanup(): boolean {
  if (VERBOSE) {
    console.log('🧹 Running worker cleanup...');
  }

  const result = spawnSync('tsx', ['./scripts/cleanup-vitest-workers.ts'], {
    cwd: PROJECT_ROOT,
    stdio: VERBOSE ? 'inherit' : 'pipe',
    encoding: 'utf8',
  });

  return result.status === 0;
}

interface BatchResult {
  success: boolean;
  exitCode: number | null;
}

// Run a single batch
function runBatch(batch: string[], batchIndex: number, totalBatches: number): BatchResult {
  const batchNum = batchIndex + 1;
  console.log(`\n📊 Batch ${batchNum}/${totalBatches} (${batch.length} files)`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  if (VERBOSE) {
    batch.forEach(file => console.log(`   - ${relative(PROJECT_ROOT, file)}`));
    console.log('');
  }

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

interface SummaryResult extends BatchResult {
  batchNum: number;
  fileCount: number;
}

// Main execution
async function main(): Promise<void> {
  const startTime = Date.now();
  const results: SummaryResult[] = [];

  try {
    const files = await discoverTestFiles();

    if (files.length === 0) {
      console.log('⚠️  No test files found matching pattern');
      process.exit(0);
    }

    const batches = createBatches(files, BATCH_SIZE);
    console.log(`📦 Created ${batches.length} batches\n`);

    for (let index = 0; index < batches.length; index += 1) {
      const batch = batches[index];

      if (index > 0) {
        console.log('');
        runCleanup();
      }

      const result = runBatch(batch, index, batches.length);
      results.push({
        batchNum: index + 1,
        fileCount: batch.length,
        ...result,
      });

      if (!result.success && FAIL_FAST) {
        console.log('\n⚠️  Fail-fast enabled, stopping execution');
        break;
      }
    }

    console.log('\n🧹 Final cleanup...');
    runCleanup();

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 Test Summary');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const totalBatches = results.length;
    const passedBatches = results.filter(result => result.success).length;
    const failedBatches = results.filter(result => !result.success).length;
    const totalFiles = results.reduce((sum, result) => sum + result.fileCount, 0);

    console.log(`⏱️  Duration: ${duration}s`);
    console.log(`📦 Total batches: ${totalBatches}`);
    console.log(`📁 Total files: ${totalFiles}`);
    console.log(`✅ Passed batches: ${passedBatches}`);
    console.log(`❌ Failed batches: ${failedBatches}`);

    if (failedBatches > 0) {
      console.log('\n❌ Failed batches:');
      results
        .filter(result => !result.success)
        .forEach(result => {
          console.log(`   - Batch ${result.batchNum} (exit code: ${result.exitCode})`);
        });
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const exitCode = failedBatches > 0 ? 1 : 0;
    process.exit(exitCode);
  } catch (error) {
    console.error('\n❌ Error during test execution:');
    console.error(error);
    process.exit(1);
  }
}

main();

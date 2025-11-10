#!/usr/bin/env node

/**
 * Batched Vitest runner with worker cleanup and optional memory diagnostics.
 */

import { spawnSync } from 'node:child_process';
import { glob } from 'glob';
import { resolve, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { totalmem, freemem } from 'node:os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = resolve(__dirname, '..');

// ---------------------------------------------------------------------------
// Argument parsing helpers
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);

const getArgValue = (name: string, fallback: string): string => {
  let value = fallback;
  for (let index = 0; index < args.length; index += 1) {
    const entry = args[index];
    const prefix = `--${name}`;
    if (entry.startsWith(`${prefix}=`)) {
      value = entry.slice(prefix.length + 1);
    } else if (entry === prefix) {
      const next = args[index + 1];
      if (next && !next.startsWith('--')) {
        value = next;
        index += 1;
      } else {
        value = 'true';
      }
    }
  }
  return value;
};

const getNumericArg = (name: string, fallback: number): number => {
  const candidate = Number.parseInt(getArgValue(name, `${fallback}`), 10);
  return Number.isFinite(candidate) ? candidate : fallback;
};

const hasFlag = (name: string): boolean =>
  args.some(entry => entry === `--${name}` || entry === `--${name}=true`);

// ---------------------------------------------------------------------------
// Runtime configuration
// ---------------------------------------------------------------------------

const PROJECT = getArgValue('project', 'unit');
const BATCH_SIZE = Math.max(1, getNumericArg('batch-size', 20));
const MEMORY = Math.max(256, getNumericArg('memory', 3072));
const RETRY_LIMIT = Math.max(0, getNumericArg('retry', 0));
const REPORTER = getArgValue('reporter', 'verbose');
const PATTERN = getArgValue('pattern', 'test/unit/**/*.{test,spec}.{ts,tsx}');
const FAIL_FAST = hasFlag('fail-fast');
const VERBOSE = hasFlag('verbose');
const MONITOR_MEMORY = hasFlag('monitor-memory');
const CLEANUP_ENABLED = !hasFlag('no-cleanup');

console.log('\n🧪 Batched Unit Test Runner');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`📦 Batch size: ${BATCH_SIZE} files`);
console.log(`💾 Memory per batch: ${MEMORY} MB`);
console.log(`🎯 Pattern: ${PATTERN}`);
console.log(`🧪 Project: ${PROJECT}`);
console.log(`🗞 Reporter: ${REPORTER}`);
console.log(`⚡ Fail-fast: ${FAIL_FAST ? 'enabled' : 'disabled'}`);
console.log(`🔁 Retry on failure: ${RETRY_LIMIT}`);
console.log(`🧠 Memory monitor: ${MONITOR_MEMORY ? 'enabled' : 'disabled'}`);
console.log(`🧹 Worker cleanup: ${CLEANUP_ENABLED ? 'enabled' : 'disabled'}`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('\n💡 Tip: Use --verbose to list batch files');
console.log('💡 Tip: Use --retry=1 to auto-retry flaky batches');
console.log('💡 Tip: Use --monitor-memory to print batch memory stats');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// ---------------------------------------------------------------------------
// Utility helpers
// ---------------------------------------------------------------------------

const toPosix = (input: string): string => input.replace(/\\/g, '/');

interface MemorySnapshot {
  total: number;
  free: number;
  used: number;
  rss: number;
  usedPercent: number;
}

const formatMB = (bytes: number): string => `${(bytes / 1024 / 1024).toFixed(1)} MB`;
const formatSignedMB = (bytes: number): string => {
  if (bytes === 0) {
    return `+${formatMB(0)}`;
  }
  const sign = bytes > 0 ? '+' : '-';
  return `${sign}${formatMB(Math.abs(bytes))}`;
};

const captureMemory = (): MemorySnapshot => {
  const total = totalmem();
  const free = freemem();
  const used = total - free;
  const rss = process.memoryUsage().rss;
  const usedPercent = total === 0 ? 0 : Number(((used / total) * 100).toFixed(1));
  return { total, free, used, rss, usedPercent };
};

const logMemorySnapshot = (label: string, snapshot: MemorySnapshot): void => {
  console.log(`${label}`);
  console.log(
    `   - System used: ${formatMB(snapshot.used)} / ${formatMB(snapshot.total)} (${snapshot.usedPercent.toFixed(1)}%)`
  );
  console.log(`   - Process RSS: ${formatMB(snapshot.rss)}`);
};

const logMemoryDelta = (before: MemorySnapshot, after: MemorySnapshot): void => {
  const usedDelta = after.used - before.used;
  const rssDelta = after.rss - before.rss;
  console.log(`   - System used delta: ${formatSignedMB(usedDelta)}`);
  console.log(`   - Process RSS delta: ${formatSignedMB(rssDelta)}`);
};

const logDivider = (): void => console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

// ---------------------------------------------------------------------------
// Core helpers
// ---------------------------------------------------------------------------

async function discoverTestFiles(): Promise<string[]> {
  console.log('🔍 Discovering test files...');

  const files = await glob(PATTERN, {
    cwd: PROJECT_ROOT,
    absolute: false,
    ignore: ['**/node_modules/**', '**/dist/**', '**/*.d.ts'],
  });

  console.log(`✅ Found ${files.length} test files\n`);

  if (VERBOSE && files.length > 0) {
    files.forEach(file => console.log(`   - ${file}`));
    console.log('');
  }

  return files;
}

function createBatches(files: string[], batchSize: number): string[][] {
  const batches: string[][] = [];
  for (let index = 0; index < files.length; index += batchSize) {
    batches.push(files.slice(index, index + batchSize));
  }
  return batches;
}

function runCleanup(): boolean {
  if (!CLEANUP_ENABLED) {
    return true;
  }

  if (VERBOSE) {
    console.log('🧹 Running worker cleanup...');
  }

  const cleanupArgs = ['./scripts/cleanup-vitest-workers.ts'];
  if (!VERBOSE) {
    cleanupArgs.push('--quiet');
  }

  const result = spawnSync('tsx', cleanupArgs, {
    cwd: PROJECT_ROOT,
    stdio: VERBOSE ? 'inherit' : 'ignore',
    env: process.env,
  });

  if (result.status !== 0 && VERBOSE) {
    console.warn('⚠️  Worker cleanup reported a non-zero exit code');
  }

  return result.status === 0;
}

interface BatchRunResult {
  success: boolean;
  exitCode: number | null;
  memoryBefore?: MemorySnapshot;
  memoryAfter?: MemorySnapshot;
}

function runSingleBatch(
  batch: string[],
  batchIndex: number,
  totalBatches: number,
  attempt: number,
  label?: string
): BatchRunResult {
  const batchNum = batchIndex + 1;
  const attemptSuffix = attempt > 1 ? ` (attempt ${attempt})` : '';
  const headerLabel = label ?? `Batch ${batchNum}/${totalBatches}`;
  console.log(`\n📊 ${headerLabel} (${batch.length} files)${attemptSuffix}`);
  logDivider();

  const relativeFiles = batch.map(file => toPosix(relative(PROJECT_ROOT, file)));

  if (VERBOSE) {
    relativeFiles.forEach(file => console.log(`   - ${file}`));
    console.log('');
  }

  let memoryBefore: MemorySnapshot | undefined;
  if (MONITOR_MEMORY) {
    memoryBefore = captureMemory();
    logMemorySnapshot('📈 Memory before batch', memoryBefore);
  }

  const vitestArgs = [
    'vitest',
    'run',
    '--project',
    PROJECT,
    `--reporter=${REPORTER}`,
    ...relativeFiles,
  ];

  const result = spawnSync('npx', vitestArgs, {
    cwd: PROJECT_ROOT,
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_OPTIONS: `--max-old-space-size=${MEMORY} --preserve-symlinks`,
      VITEST_MAX_THREADS: '1',
    },
  });

  let success = result.status === 0;
  let exitCode = result.status ?? null;

  if (!success) {
    if (typeof result.signal === 'string') {
      exitCode = 1;
    }
    if (result.error) {
      console.error(`❌ Failed to execute Vitest: ${(result.error as Error).message}`);
      exitCode = 1;
    }
  }

  let memoryAfter: MemorySnapshot | undefined;
  if (MONITOR_MEMORY) {
    memoryAfter = captureMemory();
    logMemorySnapshot('📉 Memory after batch', memoryAfter);
    if (memoryBefore) {
      logMemoryDelta(memoryBefore, memoryAfter);
    }
  }

  if (success) {
    console.log(`✅ ${headerLabel} passed`);
  } else {
    console.log(`❌ ${headerLabel} failed (exit code: ${exitCode ?? 'unknown'})`);
  }

  return { success, exitCode, memoryBefore, memoryAfter };
}

interface SummaryResult extends BatchRunResult {
  batchNum: number;
  fileCount: number;
  attempts: number;
  label: string;
}

function runBatchWithRetry(
  batch: string[],
  index: number,
  total: number,
  label?: string
): SummaryResult {
  let attempt = 0;
  let latest: BatchRunResult = { success: false, exitCode: 1 };
  const defaultLabel = `Batch ${index + 1}`;
  const labelToUse = label ?? defaultLabel;

  while (attempt <= RETRY_LIMIT) {
    attempt += 1;
    latest = runSingleBatch(batch, index, total, attempt, labelToUse);

    if (latest.success) {
      break;
    }

    if (attempt <= RETRY_LIMIT) {
      console.log(
        `\n🔁 Retrying batch ${index + 1} (attempt ${attempt + 1}/${RETRY_LIMIT + 1})...`
      );
      runCleanup();
    }
  }

  return {
    batchNum: index + 1,
    fileCount: batch.length,
    attempts: attempt,
    label: labelToUse,
    ...latest,
  };
}

function splitBatchAndRun(batch: string[], index: number, total: number): SummaryResult[] {
  console.log(`\n🪓 Splitting batch ${index + 1} into ${batch.length} single-file runs`);
  const results: SummaryResult[] = [];

  for (let subIndex = 0; subIndex < batch.length; subIndex += 1) {
    const file = batch[subIndex];
    const relativeFile = toPosix(relative(PROJECT_ROOT, file));
    const label = `Batch ${index + 1}.${subIndex + 1}/${total}`;
    console.log(`   ↳ ${label} → ${relativeFile}`);
    runCleanup();
    const summary = runBatchWithRetry([file], index, total, label);
    results.push(summary);
  }

  return results;
}

// ---------------------------------------------------------------------------
// Main execution flow
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const startTime = Date.now();
  const results: SummaryResult[] = [];

  try {
    if (CLEANUP_ENABLED) {
      runCleanup();
    }

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

      const summary = runBatchWithRetry(batch, index, batches.length);

      if (summary.success) {
        results.push(summary);
      } else if (batch.length === 1) {
        results.push(summary);
        if (FAIL_FAST) {
          console.log('\n⚠️  Fail-fast enabled, stopping execution');
          break;
        }
      } else {
        const splitResults = splitBatchAndRun(batch, index, batches.length);
        results.push(...splitResults);

        const hasSplitFailure = splitResults.some(result => !result.success);
        if (hasSplitFailure && FAIL_FAST) {
          console.log('\n⚠️  Fail-fast enabled, stopping execution');
          break;
        }
      }
    }

    console.log('\n🧹 Final cleanup...');
    runCleanup();

    const endTime = Date.now();
    const durationSeconds = ((endTime - startTime) / 1000).toFixed(2);

    logDivider();
    console.log('📊 Test Summary');
    logDivider();

    const totalBatches = results.length;
    const passedBatches = results.filter(result => result.success).length;
    const failedBatches = results.filter(result => !result.success).length;
    const totalFiles = results.reduce((sum, result) => sum + result.fileCount, 0);
    const maxAttempts = results.reduce((max, result) => Math.max(max, result.attempts), 0);

    console.log(`⏱️  Duration: ${durationSeconds}s`);
    console.log(`📦 Total batches: ${totalBatches}`);
    console.log(`📁 Total files: ${totalFiles}`);
    console.log(`✅ Passed batches: ${passedBatches}`);
    console.log(`❌ Failed batches: ${failedBatches}`);
    console.log(`🔁 Max attempts per batch: ${maxAttempts}`);

    if (MONITOR_MEMORY) {
      const deltas = results
        .filter(result => result.memoryBefore && result.memoryAfter)
        .map(result => result.memoryAfter!.used - result.memoryBefore!.used);
      if (deltas.length > 0) {
        const aggregateDelta = deltas.reduce((sum, delta) => sum + delta, 0);
        console.log(`🧠 Aggregate system memory delta: ${formatSignedMB(aggregateDelta)}`);
      }
    }

    if (failedBatches > 0) {
      console.log('\n❌ Failed batches:');
      results
        .filter(result => !result.success)
        .forEach(result => {
          console.log(
            `   - ${result.label} (exit code: ${result.exitCode ?? 'unknown'}, attempts: ${result.attempts})`
          );
        });
    }

    logDivider();
    console.log('');

    process.exit(failedBatches > 0 ? 1 : 0);
  } catch (error) {
    console.error('\n❌ Error during test execution:');
    console.error(error);
    process.exit(1);
  }
}

main();

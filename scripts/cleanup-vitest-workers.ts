#!/usr/bin/env node
/**
 * Vitest Worker Process Auto Cleanup Script
 *
 * Automatically terminates orphaned Vitest worker processes to free memory.
 */

import { execSync } from 'node:child_process';
import { freemem, totalmem } from 'node:os';

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
} as const;

type ColorKey = keyof typeof colors;
type KillSignal = 'SIGTERM' | 'SIGKILL';

function log(message: string, color: ColorKey = 'reset'): void {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function execSafe(command: string): string {
  try {
    return execSync(command, { encoding: 'utf-8', stdio: 'pipe' }).trim();
  } catch {
    return '';
  }
}

function getVitestWorkerPids(): string[] {
  const output = execSafe('ps aux | grep "[v]itest/dist/workers/forks.js" | awk \'{print $2}\'');
  if (!output) return [];
  return output.split('\n').filter(Boolean);
}

function isProcessAlive(pid: string): boolean {
  try {
    process.kill(Number.parseInt(pid, 10), 0);
    return true;
  } catch {
    return false;
  }
}

function formatMemory(bytes: number): string {
  const gb = bytes / 1024 / 1024 / 1024;
  return `${gb.toFixed(1)}GB`;
}

function printMemoryStatus(): void {
  const total = totalmem();
  const free = freemem();
  const used = total - free;
  const usedPercent = ((used / total) * 100).toFixed(1);

  console.log(`  Total: ${formatMemory(total)}`);
  console.log(`  Used: ${formatMemory(used)} (${usedPercent}%)`);
  console.log(`  Free: ${formatMemory(free)}`);
}

function printProcessMemory(pids: string[]): void {
  if (pids.length === 0) return;

  console.log('\n📊 Memory Usage Report:');
  const output = execSafe('ps aux --sort=-%mem | grep "[v]itest/dist/workers/forks.js" | head -5');
  if (output) {
    const lines = output.split('\n').filter(line => line.trim());
    if (lines.length > 0) {
      console.log(lines.join('\n'));
    } else {
      console.log('  (no detailed info)');
    }
  }
}

function killProcess(pid: string, signal: KillSignal = 'SIGTERM'): boolean {
  try {
    process.kill(Number.parseInt(pid, 10), signal);
    return true;
  } catch {
    return false;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => globalThis.setTimeout(resolve, ms));
}

async function main(): Promise<number> {
  console.log('🧹 Starting Vitest Worker Process Cleanup...\n');

  let workerPids = getVitestWorkerPids();

  if (workerPids.length === 0) {
    log('✓ No Vitest worker processes to clean up.', 'green');
    return 0;
  }

  log(`⚠️  Found ${workerPids.length} Vitest worker(s)`, 'yellow');
  printProcessMemory(workerPids);

  console.log('\n🔄 Terminating processes...');

  for (const pid of workerPids) {
    if (isProcessAlive(pid) && killProcess(pid, 'SIGTERM')) {
      console.log(`  - PID ${pid}: sent SIGTERM`);
    }
  }

  await sleep(2000);

  const remainingPids = getVitestWorkerPids();

  if (remainingPids.length > 0) {
    log('⚠️  Some processes still running. Sending SIGKILL...', 'yellow');
    for (const pid of remainingPids) {
      if (isProcessAlive(pid) && killProcess(pid, 'SIGKILL')) {
        console.log(`  - PID ${pid}: sent SIGKILL`);
      }
    }
    await sleep(1000);
  }

  workerPids = getVitestWorkerPids();

  if (workerPids.length === 0) {
    log('\n✓ All Vitest worker processes successfully cleaned up.', 'green');
    console.log('\n📊 Memory Status After Cleanup:');
    printMemoryStatus();
    console.log('\n✅ Cleanup Complete');
    return 0;
  }

  log('\n❌ Some processes are still running.', 'red');
  console.log(`Remaining processes: ${workerPids.join(', ')}`);
  return 1;
}

main()
  .then(exitCode => process.exit(exitCode))
  .catch(error => {
    log(`❌ Error occurred: ${(error as Error).message}`, 'red');
    console.error(error);
    process.exit(1);
  });

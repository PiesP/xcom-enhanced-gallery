#!/usr/bin/env node
/**
 * Vitest worker cleanup helper with optional memory diagnostics.
 */

import { execSync } from 'node:child_process';
import { freemem, totalmem } from 'node:os';

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

const hasFlag = (name: string): boolean =>
  args.some(entry => entry === `--${name}` || entry === `--${name}=true`);

const QUIET = hasFlag('quiet');
const FORCE_KILL_ONLY = hasFlag('force');
const DRY_RUN = hasFlag('dry-run');
const RUN_GC = hasFlag('gc');
const PATTERN = getArgValue('pattern', 'vitest');
const TERM_WAIT_MS = Math.max(0, Number.parseInt(getArgValue('term-wait', '1500'), 10) || 0);
const KILL_WAIT_MS = Math.max(0, Number.parseInt(getArgValue('kill-wait', '750'), 10) || 0);

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
} as const;

type ColorKey = keyof typeof colors;

const log = (message: string, color: ColorKey = 'reset'): void => {
  if (QUIET) return;
  console.log(`${colors[color]}${message}${colors.reset}`);
};

const execSafe = (command: string): string => {
  try {
    return execSync(command, { encoding: 'utf-8', stdio: 'pipe' }).trim();
  } catch {
    return '';
  }
};

interface ProcessInfo {
  pid: number;
  cpu: number;
  memory: number;
  command: string;
}

type NodeSignal = Parameters<typeof process.kill>[1];

const parseProcesses = (): ProcessInfo[] => {
  const output = execSafe('ps -eo pid=,pcpu=,pmem=,command=');
  if (!output) return [];

  const processes: ProcessInfo[] = [];
  for (const line of output.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const match = trimmed.match(/^(\d+)\s+(\S+)\s+(\S+)\s+(.+)$/);
    if (!match) continue;
    const [, pidStr, cpuStr, memStr, command] = match;
    const pid = Number.parseInt(pidStr, 10);
    if (!Number.isFinite(pid)) continue;
    const cpu = Number.parseFloat(cpuStr);
    const memory = Number.parseFloat(memStr);
    const normalized = command.toLowerCase();
    if (normalized.includes('cleanup-vitest-workers')) continue;
    if (!normalized.includes('vitest')) continue;
    if (!(normalized.includes('worker') || normalized.includes('fork'))) continue;
    if (!normalized.includes(PATTERN.toLowerCase())) continue;
    processes.push({
      pid,
      cpu: Number.isFinite(cpu) ? cpu : 0,
      memory: Number.isFinite(memory) ? memory : 0,
      command,
    });
  }
  return processes;
};

const isProcessAlive = (pid: number): boolean => {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
};

const killProcess = (pid: number, signal: NodeSignal): boolean => {
  try {
    process.kill(pid, signal);
    return true;
  } catch {
    return false;
  }
};

const sleep = (ms: number): Promise<void> =>
  new Promise(resolve => globalThis.setTimeout(resolve, ms));

const formatMB = (bytes: number): string => `${(bytes / 1024 / 1024).toFixed(1)} MB`;
const formatSignedMB = (bytes: number): string => {
  if (bytes === 0) return `+${formatMB(0)}`;
  const sign = bytes > 0 ? '+' : '-';
  return `${sign}${formatMB(Math.abs(bytes))}`;
};

interface MemorySnapshot {
  total: number;
  free: number;
  used: number;
}

const captureMemory = (): MemorySnapshot => {
  const total = totalmem();
  const free = freemem();
  return { total, free, used: total - free };
};

const logMemory = (label: string, snapshot: MemorySnapshot): void => {
  if (QUIET) return;
  const usedPercent = snapshot.total === 0 ? 0 : (snapshot.used / snapshot.total) * 100;
  console.log(`${label}`);
  console.log(`  - Used: ${formatMB(snapshot.used)} (${usedPercent.toFixed(1)}%)`);
  console.log(`  - Free: ${formatMB(snapshot.free)}`);
  console.log(`  - Total: ${formatMB(snapshot.total)}`);
};

const reportProcesses = (processes: ProcessInfo[]): void => {
  if (QUIET || processes.length === 0) return;
  console.log('\nTop Vitest workers (by memory)');
  processes
    .slice()
    .sort((a, b) => b.memory - a.memory)
    .slice(0, 5)
    .forEach(proc => {
      console.log(
        `  - PID ${proc.pid} | CPU ${proc.cpu.toFixed(1)}% | MEM ${proc.memory.toFixed(1)}% | ${proc.command}`
      );
    });
};

async function cleanup(): Promise<number> {
  const beforeMemory = captureMemory();
  if (!QUIET) {
    console.log('🧹 Starting Vitest worker cleanup...');
    logMemory('\nSystem memory before cleanup', beforeMemory);
  }

  let processes = parseProcesses();

  if (processes.length === 0) {
    log('✓ No Vitest worker processes detected.', 'green');
    return 0;
  }

  log(`⚠️  Found ${processes.length} Vitest worker(s)`, 'yellow');
  reportProcesses(processes);

  if (DRY_RUN) {
    log('\nDry run enabled, no processes were terminated.', 'blue');
    return 0;
  }

  if (!FORCE_KILL_ONLY) {
    for (const proc of processes) {
      if (isProcessAlive(proc.pid) && killProcess(proc.pid, 'SIGTERM')) {
        log(`  - PID ${proc.pid}: sent SIGTERM`, 'blue');
      }
    }
    if (TERM_WAIT_MS > 0) {
      await sleep(TERM_WAIT_MS);
    }
  }

  if (FORCE_KILL_ONLY) {
    processes = parseProcesses();
  } else {
    processes = parseProcesses();
    processes = processes.filter(proc => isProcessAlive(proc.pid));
  }

  if (processes.length > 0) {
    if (!QUIET) {
      console.log('\nEscalating to SIGKILL for remaining processes...');
    }
    for (const proc of processes) {
      if (killProcess(proc.pid, 'SIGKILL')) {
        log(`  - PID ${proc.pid}: sent SIGKILL`, 'yellow');
      }
    }
    if (KILL_WAIT_MS > 0) {
      await sleep(KILL_WAIT_MS);
    }
  }

  if (RUN_GC && typeof globalThis.gc === 'function') {
    globalThis.gc();
  }

  const remaining = parseProcesses();

  const afterMemory = captureMemory();
  if (!QUIET) {
    logMemory('\nSystem memory after cleanup', afterMemory);
    const usedDelta = afterMemory.used - beforeMemory.used;
    console.log(`  - Used memory delta: ${formatSignedMB(usedDelta)}`);
  }

  if (remaining.length === 0) {
    log('\n✓ Cleanup complete.', 'green');
    return 0;
  }

  log('\n❌ Some Vitest workers are still running:', 'red');
  if (!QUIET) {
    remaining.forEach(proc => console.log(`  - PID ${proc.pid} | ${proc.command}`));
  }
  return 1;
}

cleanup()
  .then(code => process.exit(code))
  .catch(error => {
    log(`❌ Cleanup failed: ${(error as Error).message}`, 'red');
    console.error(error);
    process.exit(1);
  });

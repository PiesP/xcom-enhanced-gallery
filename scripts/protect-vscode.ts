#!/usr/bin/env node
/**
 * VS Code Server Comprehensive Protection Script.
 */

import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { freemem, totalmem } from 'node:os';

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
} as const;

type ColorKey = keyof typeof colors;

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

function readFileSafe(path: string): string | null {
  try {
    return readFileSync(path, 'utf-8').trim();
  } catch {
    return null;
  }
}

function writeFileWithSudo(path: string, content: string): boolean {
  try {
    execSync(`echo ${content} | sudo tee ${path}`, { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

function getVSCodeServerPids(): string[] {
  const output = execSafe('pgrep -f "server-main.js"');
  return output ? output.split('\n').filter(Boolean) : [];
}

function getAllVSCodePids(): string[] {
  const output = execSafe('pgrep -f "vscode-server"');
  return output ? output.split('\n').filter(Boolean) : [];
}

function formatMemory(bytes: number): string {
  const gb = bytes / 1024 / 1024 / 1024;
  return `${gb.toFixed(1)}GB`;
}

function adjustOOMScore(): void {
  console.log('[1/4] Adjusting OOM Score...');

  const pids = getVSCodeServerPids();

  if (pids.length === 0) {
    log('  ⚠ VS Code Server not running', 'yellow');
    return;
  }

  for (const pid of pids) {
    const oomScorePath = `/proc/${pid}/oom_score_adj`;
    const currentScore = readFileSafe(oomScorePath);

    if (currentScore === null) {
      log(`  ⚠ Cannot read OOM Score for PID ${pid}`, 'yellow');
      continue;
    }

    if (currentScore === '-500') {
      log(`  ✓ PID ${pid} already protected (OOM Score: -500)`, 'green');
      continue;
    }

    if (writeFileWithSudo(oomScorePath, '-500')) {
      log(`  ✓ Protected PID ${pid} (OOM Score: ${currentScore} → -500)`, 'green');
    } else {
      log(`  ⚠ Failed to protect PID ${pid} (need sudo)`, 'yellow');
    }
  }
}

function adjustNiceValue(): void {
  console.log('\n[2/4] Adjusting process priority...');

  const pids = getAllVSCodePids();

  if (pids.length === 0) {
    log('  ⚠ No VS Code Server processes found', 'yellow');
    return;
  }

  let protectedCount = 0;
  for (const pid of pids) {
    const result = execSafe(`sudo renice -n -5 -p ${pid}`);
    if (result) {
      protectedCount += 1;
    }
  }

  if (protectedCount > 0) {
    log(`  ✓ Priority adjusted for ${protectedCount} processes (nice: -5)`, 'green');
  } else {
    log('  ⚠ Failed to adjust priority (need sudo)', 'yellow');
  }
}

function checkSwapSettings(): void {
  console.log('\n[3/4] Checking swap settings...');

  const swappiness = readFileSafe('/proc/sys/vm/swappiness');

  if (!swappiness) {
    log('  ⚠ Cannot read swappiness', 'yellow');
    return;
  }

  console.log(`  Current swappiness: ${swappiness}`);

  if (Number.parseInt(swappiness, 10) > 10) {
    log('  ⚠ Swappiness is high (recommend: 10)', 'yellow');
    console.log('  To apply: sudo sysctl vm.swappiness=10');
    console.log('  Permanent: echo "vm.swappiness=10" | sudo tee -a /etc/sysctl.conf');
  } else {
    log('  ✓ Swappiness optimal', 'green');
  }
}

function checkMemoryUsage(): void {
  console.log('\n[4/4] Checking memory usage...');
  console.log('  Current memory status:');

  const total = totalmem();
  const free = freemem();
  const used = total - free;
  const usedPercent = Math.round((used / total) * 100);
  const availableGb = formatMemory(free);

  console.log(`    Total: ${formatMemory(total)}`);
  console.log(`    Used: ${formatMemory(used)} (${usedPercent}%)`);
  console.log(`    Free: ${formatMemory(free)}`);

  console.log(`\n  Memory usage: ${usedPercent}%`);
  console.log(`  Available: ${availableGb}`);

  if (usedPercent > 85) {
    log('  ⚠ HIGH memory usage! Consider:', 'red');
    console.log('    - Closing unnecessary applications');
    console.log('    - Running: npm run test:cleanup');
    console.log('    - Running: sync && echo 3 | sudo tee /proc/sys/vm/drop_caches');
    console.log('    - Checking: ps aux --sort=-%mem | head -20');
  } else if (usedPercent > 75) {
    log('  ⚠ Moderate memory usage (monitor closely)', 'yellow');
  } else {
    log('  ✓ Memory usage healthy', 'green');
  }
}

function main(): number {
  if (process.platform !== 'linux') {
    log('ℹ️  VS Code Server protection is Linux-specific; skipping on this OS.', 'yellow');
    return 0;
  }

  log('=== VS Code Server Protection Script ===\n', 'cyan');

  try {
    adjustOOMScore();
    adjustNiceValue();
    checkSwapSettings();
    checkMemoryUsage();

    console.log('\n' + '='.repeat(40));
    log('✅ Protection script completed', 'green');
    console.log('='.repeat(40));

    return 0;
  } catch (error) {
    const err = error as Error;
    log(`\n❌ Error: ${err.message}`, 'red');
    console.error(error);
    return 1;
  }
}

process.exit(main());

#!/usr/bin/env node
/**
 * Vitest Worker Process Auto Cleanup Script
 *
 * @description Automatically terminates orphaned Vitest worker processes to free memory
 * @usage Runs automatically after tests or manually via 'npm run test:cleanup'
 *
 * @benefits
 * - Cross-platform compatible (Windows, Linux, macOS)
 * - Improved error handling
 * - Easy npm script integration
 * - Project-wide consistency (all scripts use JavaScript)
 */

import { execSync } from 'node:child_process';
import { freemem, totalmem } from 'node:os';

// ANSI 색상 코드
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

/**
 * Print colored console message
 */
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Execute command safely and return output (ignore errors)
 */
function execSafe(command) {
  try {
    return execSync(command, { encoding: 'utf-8', stdio: 'pipe' }).trim();
  } catch {
    // If pgrep doesn't find the process, it returns exit code 1.
    // This is normal behavior, so we return an empty string.
    return '';
  }
}

/**
 * Get list of Vitest worker process PIDs
 */
function getVitestWorkerPids() {
  // Use ps aux to find only exact processes.
  // Use [v]itest pattern to prevent grep from matching itself.
  const output = execSafe('ps aux | grep "[v]itest/dist/workers/forks.js" | awk \'{print $2}\'');
  if (!output) return [];

  return output.split('\n').filter(Boolean);
}

/**
 * Check if a process is alive
 */
function isProcessAlive(pid) {
  try {
    process.kill(parseInt(pid, 10), 0);
    return true;
  } catch {
    return false;
  }
}

/**
 * Format memory bytes to GB string
 */
function formatMemory(bytes) {
  const gb = bytes / 1024 / 1024 / 1024;
  return `${gb.toFixed(1)}GB`;
}

/**
 * Print current memory status
 */
function printMemoryStatus() {
  const total = totalmem();
  const free = freemem();
  const used = total - free;
  const usedPercent = ((used / total) * 100).toFixed(1);

  console.log(`  Total: ${formatMemory(total)}`);
  console.log(`  Used: ${formatMemory(used)} (${usedPercent}%)`);
  console.log(`  Free: ${formatMemory(free)}`);
}

/**
 * Print process memory usage
 */
function printProcessMemory(pids) {
  if (pids.length === 0) return;

  console.log('\n📊 Memory Usage Report:');
  // Use [v]itest pattern to prevent grep from matching itself
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

/**
 * Send signal to a process
 */
function killProcess(pid, signal = 'SIGTERM') {
  try {
    process.kill(parseInt(pid, 10), signal);
    return true;
  } catch {
    return false;
  }
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms) {
  // eslint-disable-next-line no-undef
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Main execution function
 */
async function main() {
  console.log('🧹 Starting Vitest Worker Process Cleanup...\n');

  // 1. Find Vitest worker processes
  let workerPids = getVitestWorkerPids();

  if (workerPids.length === 0) {
    log('✓ No Vitest worker processes to clean up.', 'green');
    return 0;
  }

  // 2. Print process information
  log(`⚠️  Found ${workerPids.length} Vitest worker(s)`, 'yellow');
  printProcessMemory(workerPids);

  // 3. Terminate processes (SIGTERM → SIGKILL)
  console.log('\n🔄 Terminating processes...');

  // Attempt graceful shutdown with SIGTERM
  for (const pid of workerPids) {
    if (isProcessAlive(pid)) {
      if (killProcess(pid, 'SIGTERM')) {
        console.log(`  - PID ${pid}: sent SIGTERM`);
      }
    }
  }

  // Wait 2 seconds for graceful termination
  await sleep(2000);

  // Check for any remaining processes
  const remainingPids = getVitestWorkerPids();

  if (remainingPids.length > 0) {
    log('⚠️  Some processes still running. Sending SIGKILL...', 'yellow');
    for (const pid of remainingPids) {
      if (isProcessAlive(pid)) {
        if (killProcess(pid, 'SIGKILL')) {
          console.log(`  - PID ${pid}: sent SIGKILL`);
        }
      }
    }
    await sleep(1000);
  }

  // 4. Verify cleanup result
  const finalCheck = getVitestWorkerPids();

  if (finalCheck.length === 0) {
    log('\n✓ All Vitest worker processes successfully cleaned up.', 'green');

    // Verify memory freed
    console.log('\n📊 Memory Status After Cleanup:');
    printMemoryStatus();

    console.log('\n✅ Cleanup Complete');
    return 0;
  } else {
    log('\n❌ Some processes are still running.', 'red');
    console.log(`Remaining processes: ${finalCheck.join(', ')}`);
    return 1;
  }
}

// Run script
main()
  .then(exitCode => process.exit(exitCode))
  .catch(error => {
    log(`❌ Error occurred: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  });

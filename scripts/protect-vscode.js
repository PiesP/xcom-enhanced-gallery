#!/usr/bin/env node
/**
 * VS Code Server 종합 보호 스크립트
 * 목적: VS Code Server 프로세스를 OOM Killer로부터 보호
 *
 * 기능:
 * 1. OOM Score 조정 (-500으로 설정, 높은 보호)
 * 2. Nice 값 조정 (-5로 설정, 높은 CPU 우선순위)
 * 3. Swap 설정 확인 및 권장사항
 * 4. 메모리 상태 모니터링
 *
 * 주의: OOM Score/Nice 조정은 sudo 권한 필요
 *
 * 장점:
 * - 크로스 플랫폼 호환 (Linux/WSL)
 * - 에러 핸들링 개선
 * - 상세한 로깅
 * - npm 스크립트 통합 용이
 */

import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { freemem, totalmem } from 'node:os';

// ANSI 색상 코드
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

/**
 * 색상이 적용된 메시지 출력
 */
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * 명령어를 실행하고 출력을 반환 (에러 무시)
 */
function execSafe(command) {
  try {
    return execSync(command, { encoding: 'utf-8', stdio: 'pipe' }).trim();
  } catch {
    return '';
  }
}

/**
 * 파일 읽기 (에러 무시)
 */
function readFileSafe(path) {
  try {
    return readFileSync(path, 'utf-8').trim();
  } catch {
    return null;
  }
}

/**
 * 파일 쓰기 (sudo 사용)
 */
function writeFileWithSudo(path, content) {
  try {
    execSync(`echo ${content} | sudo tee ${path}`, { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

/**
 * VS Code Server 메인 프로세스 PID 가져오기
 */
function getVSCodeServerPids() {
  const output = execSafe('pgrep -f "server-main.js"');
  return output ? output.split('\n').filter(Boolean) : [];
}

/**
 * VS Code Server 전체 프로세스 PID 가져오기
 */
function getAllVSCodePids() {
  const output = execSafe('pgrep -f "vscode-server"');
  return output ? output.split('\n').filter(Boolean) : [];
}

/**
 * 메모리 상태 포맷팅
 */
function formatMemory(bytes) {
  const gb = bytes / 1024 / 1024 / 1024;
  return `${gb.toFixed(1)}GB`;
}

/**
 * OOM Score 조정
 */
function adjustOOMScore() {
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

    // OOM Score 조정 시도
    if (writeFileWithSudo(oomScorePath, '-500')) {
      log(`  ✓ Protected PID ${pid} (OOM Score: ${currentScore} → -500)`, 'green');
    } else {
      log(`  ⚠ Failed to protect PID ${pid} (need sudo)`, 'yellow');
    }
  }
}

/**
 * Nice 값 조정
 */
function adjustNiceValue() {
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
      protectedCount++;
    }
  }

  if (protectedCount > 0) {
    log(`  ✓ Priority adjusted for ${protectedCount} processes (nice: -5)`, 'green');
  } else {
    log('  ⚠ Failed to adjust priority (need sudo)', 'yellow');
  }
}

/**
 * Swap 설정 확인
 */
function checkSwapSettings() {
  console.log('\n[3/4] Checking swap settings...');

  const swappiness = readFileSafe('/proc/sys/vm/swappiness');

  if (!swappiness) {
    log('  ⚠ Cannot read swappiness', 'yellow');
    return;
  }

  console.log(`  Current swappiness: ${swappiness}`);

  if (parseInt(swappiness, 10) > 10) {
    log('  ⚠ Swappiness is high (recommend: 10)', 'yellow');
    console.log('  To apply: sudo sysctl vm.swappiness=10');
    console.log('  Permanent: echo "vm.swappiness=10" | sudo tee -a /etc/sysctl.conf');
  } else {
    log('  ✓ Swappiness optimal', 'green');
  }
}

/**
 * 메모리 상태 확인
 */
function checkMemoryUsage() {
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

/**
 * 메인 실행 함수
 */
function main() {
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
    log(`\n❌ Error: ${error.message}`, 'red');
    console.error(error);
    return 1;
  }
}

// 스크립트 실행
process.exit(main());
